import Role from "../models/Role.js";
import roles from "../constants/roles.js";

const roleSeeder = async () => {
  try {
    // iterate through the constant values and ensure each role exists
    const names = Object.values(roles);
    for (const name of names) {
      await Role.updateOne(
        { name },
        { name },
        { upsert: true }
      );
    }
    console.log("Roles seeded:", names);
  } catch (err) {
    console.error("Error seeding roles:", err);
  }
};

export default roleSeeder;