import Department from "../models/Department.js";

const SOFTWARE_COMPANY_DEPARTMENT_STRUCTURE = [
  { name: "Company", code: "COMP", parent: null },
  { name: "Executive Leadership", code: "EXEC", parent: "Company" },
  { name: "Engineering", code: "ENG", parent: "Company" },
  { name: "Frontend", code: "FEND", parent: "Engineering" },
  { name: "Backend", code: "BEND", parent: "Engineering" },
  { name: "DevOps", code: "DEVOPS", parent: "Engineering" },
  { name: "Product", code: "PROD", parent: "Company" },
  { name: "Product Management", code: "PRODMGT", parent: "Company" },
  { name: "QA", code: "QA", parent: "Company" },
  { name: "Design", code: "DSGN", parent: "Company" },
  { name: "Sales", code: "SLS", parent: "Company" },
  { name: "Marketing", code: "MKT", parent: "Company" },
  { name: "Customer Success", code: "CS", parent: "Company" },
  { name: "HR", code: "HR", parent: "Company" },
  { name: "Finance", code: "FIN", parent: "Company" },
  { name: "IT Support", code: "IT", parent: "Company" },
  { name: "Operations", code: "OPS", parent: "Company" },
  { name: "Administration", code: "ADMIN", parent: "Company" },
];

const departmentSeeder = async () => {
  try {
    // Pass 1: Ensure all departments exist.
    for (const item of SOFTWARE_COMPANY_DEPARTMENT_STRUCTURE) {
      await Department.updateOne(
        { name: item.name },
        {
          $setOnInsert: {
            name: item.name,
            parentDepartmentId: null,
          },
          $set: {
            code: item.code,
            status: "active",
          },
        },
        { upsert: true },
      );
    }

    // Build a name-to-id map for parent assignment.
    const departments = await Department.find({
      name: { $in: SOFTWARE_COMPANY_DEPARTMENT_STRUCTURE.map((item) => item.name) },
    })
      .select("_id name")
      .lean();

    const idByName = new Map(departments.map((department) => [department.name, department._id]));

    // Pass 2: Set parent references from the declared structure.
    for (const item of SOFTWARE_COMPANY_DEPARTMENT_STRUCTURE) {
      const parentDepartmentId = item.parent ? idByName.get(item.parent) || null : null;
      await Department.updateOne(
        { name: item.name },
        { $set: { parentDepartmentId } },
      );
    }

    console.log("Departments seeded with hierarchy:", SOFTWARE_COMPANY_DEPARTMENT_STRUCTURE.map((item) => item.name));
  } catch (err) {
    console.error("Error seeding departments:", err);
  }
};

export default departmentSeeder;
