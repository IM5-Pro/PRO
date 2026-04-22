import Shift from "../models/Shift.js";
import EmployeeShift from "../models/EmployeeShift.js";
import Employee from "../models/Employee.js";

const shiftSeeder = async () => {
  try {
    console.log("🔄 Starting shift seeder...");

    // Define default shifts
    const defaultShifts = [
      {
        name: "Day Shift",
        code: "DAY",
        startTime: "09:00",
        endTime: "17:00",
        gracePeriodMinutes: 15,
        earlyCheckoutThresholdMinutes: 30,
      },
      {
        name: "Morning Shift",
        code: "MORNING",
        startTime: "08:00",
        endTime: "16:00",
        gracePeriodMinutes: 15,
        earlyCheckoutThresholdMinutes: 30,
      },
      {
        name: "Evening Shift",
        code: "EVENING",
        startTime: "14:00",
        endTime: "22:00",
        gracePeriodMinutes: 15,
        earlyCheckoutThresholdMinutes: 30,
      },
      {
        name: "Night Shift",
        code: "NIGHT",
        startTime: "22:00",
        endTime: "06:00",
        gracePeriodMinutes: 15,
        earlyCheckoutThresholdMinutes: 30,
      },
      {
        name: "Flexible Shift",
        code: "FLEXIBLE",
        startTime: "10:00",
        endTime: "18:00",
        gracePeriodMinutes: 30,
        earlyCheckoutThresholdMinutes: 45,
      },
    ];

    // Create shifts if they don't exist
    const createdShifts = [];
    for (const shiftData of defaultShifts) {
      const existingShift = await Shift.findOne({ code: shiftData.code });
      if (!existingShift) {
        const shift = await Shift.create({
          ...shiftData,
          isActive: true,
          createdBy: null,
        });
        createdShifts.push(shift);
        console.log(`✅ Created shift: ${shift.name}`);
      } else {
        createdShifts.push(existingShift);
        console.log(`⏭️  Shift already exists: ${existingShift.name}`);
      }
    }

    // Get the Day Shift as default
    const defaultShift = await Shift.findOne({ code: "DAY" });

    // Assign shifts to employees who don't have one
    const employeesWithoutShift = await Employee.find({
      isActive: true,
    });

    let assignedCount = 0;
    for (const employee of employeesWithoutShift) {
      const hasActiveShift = await EmployeeShift.findOne({
        employee: employee._id,
        isActive: true,
      });

      if (!hasActiveShift && defaultShift) {
        // Create a new employee shift assignment
        await EmployeeShift.create({
          employee: employee._id,
          shift: defaultShift._id,
          effectiveFrom: new Date(),
          isActive: true,
          createdBy: null,
        });

        assignedCount++;
        console.log(
          `✅ Assigned shift to employee: ${employee.firstName} ${employee.lastName}`
        );
      }
    }

    console.log(
      `\n✨ Shift seeder completed! Assigned shifts to ${assignedCount} employees.`
    );
  } catch (err) {
    console.error("❌ Error in shift seeder:", err.message);
  }
};

export default shiftSeeder;
