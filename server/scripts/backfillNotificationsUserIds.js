#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from '../src/models/Notification.js';
import User from '../src/models/User.js';
import Employee from '../src/models/Employee.js';

dotenv.config();

const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hrms';

const batchSize = 500;

const run = async () => {
  await mongoose.connect(MONGO, { autoIndex: false });
  console.log('Connected to', MONGO);

  try {
    // Find notifications where the userId does not match a User but matches an Employee
    const cursor = Notification.find({}).cursor();
    let updated = 0;
    let inspected = 0;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      inspected++;
      const uid = doc.userId;
      if (!uid) continue;

      // If there is a User with this id, skip
      const u = await User.findById(uid).select('_id').lean();
      if (u && u._id) continue;

      // Otherwise check if an Employee exists with this id
      const emp = await Employee.findById(uid).select('_id').lean();
      if (!emp || !emp._id) continue;

      // Find linked user for that employee
      const linkedUser = await User.findOne({ employeeId: emp._id }).select('_id').lean();
      if (!linkedUser || !linkedUser._id) {
        console.warn('No linked user found for employee', emp._id.toString());
        continue;
      }

      // Update notification
      await Notification.updateOne({ _id: doc._id }, { $set: { userId: linkedUser._id } });
      updated++;

      if (updated % batchSize === 0) {
        console.log(`Updated ${updated} notifications so far...`);
      }
    }

    console.log(`Inspected ${inspected} notifications. Updated ${updated} notifications.`);
  } catch (err) {
    console.error('Backfill error', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected. Done.');
  }
};

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
