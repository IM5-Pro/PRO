import Department from "../models/Department.js";
import Designation from "../models/Designation.js";

const DESIGNATION_CATALOG = [
  // 0) Company & Executive Leadership
  { name: "Company Representative", code: "COMPREP", level: 6, department: "Company", reportingTo: null },
  { name: "Business Analyst", code: "BA", level: 4, department: "Company", reportingTo: "Company Representative" },
  { name: "Project Coordinator", code: "PCORD", level: 3, department: "Company", reportingTo: "Company Representative" },
  { name: "Executive Assistant", code: "EXASST", level: 3, department: "Executive Leadership", reportingTo: null },
  { name: "Executive Advisor", code: "EXADV", level: 5, department: "Executive Leadership", reportingTo: "Executive Assistant" },

  // 0A) Administration
  { name: "Administration Manager", code: "ADMM", level: 6, department: "Administration", reportingTo: null },
  { name: "Senior Administrator", code: "SADM", level: 4, department: "Administration", reportingTo: "Administration Manager" },
  { name: "Administrator", code: "ADM", level: 3, department: "Administration", reportingTo: "Senior Administrator" },
  { name: "Office Executive", code: "OFFEX", level: 3, department: "Administration", reportingTo: "Administrator" },
  { name: "Administrative Intern", code: "ADMIT", level: 1, department: "Administration", reportingTo: "Office Executive" },

  // 1) Executive / Leadership
  { name: "Chief Executive Officer (CEO)", code: "CEO", level: 8, department: null, reportingTo: null },
  { name: "Chief Technology Officer (CTO)", code: "CTO", level: 8, department: null, reportingTo: "Chief Executive Officer (CEO)" },
  { name: "Chief Operating Officer (COO)", code: "COO", level: 8, department: null, reportingTo: "Chief Executive Officer (CEO)" },
  { name: "Chief Financial Officer (CFO)", code: "CFO", level: 8, department: null, reportingTo: "Chief Executive Officer (CEO)" },
  { name: "Chief Human Resources Officer (CHRO)", code: "CHRO", level: 8, department: null, reportingTo: "Chief Executive Officer (CEO)" },
  { name: "Vice President (VP)", code: "VP", level: 8, department: null, reportingTo: "Chief Executive Officer (CEO)" },
  { name: "Director", code: "DIR", level: 7, department: null, reportingTo: "Vice President (VP)" },

  // 2) Engineering / Development
  { name: "Director of Engineering", code: "DOE", level: 7, department: "Engineering", reportingTo: "Chief Technology Officer (CTO)" },
  { name: "Senior Engineering Manager", code: "SEM", level: 7, department: "Engineering", reportingTo: "Director of Engineering" },
  { name: "Engineering Manager", code: "EM", level: 6, department: "Engineering", reportingTo: "Senior Engineering Manager" },
  { name: "Lead Engineer / Tech Lead", code: "LEAD", level: 5, department: "Engineering", reportingTo: "Engineering Manager" },
  { name: "Senior Software Engineer", code: "SSE", level: 4, department: "Engineering", reportingTo: "Lead Engineer / Tech Lead" },
  { name: "Software Engineer", code: "SE", level: 3, department: "Engineering", reportingTo: "Senior Software Engineer" },
  { name: "Associate Software Engineer", code: "ASE", level: 2, department: "Engineering", reportingTo: "Software Engineer" },
  { name: "Trainee Engineer", code: "TE", level: 1, department: "Engineering", reportingTo: "Associate Software Engineer" },
  { name: "Intern", code: "INT", level: 1, department: "Engineering", reportingTo: "Trainee Engineer" },

  // 3) Product Management
  { name: "Head of Product", code: "HOP", level: 7, department: "Product Management", reportingTo: "Chief Technology Officer (CTO)" },
  { name: "Group Product Manager", code: "GPM", level: 7, department: "Product Management", reportingTo: "Head of Product" },
  { name: "Senior Product Manager", code: "SPM", level: 6, department: "Product Management", reportingTo: "Group Product Manager" },
  { name: "Product Manager", code: "PM", level: 5, department: "Product Management", reportingTo: "Senior Product Manager" },
  { name: "Associate Product Manager", code: "APM", level: 3, department: "Product Management", reportingTo: "Product Manager" },
  { name: "Product Intern", code: "PINT", level: 1, department: "Product Management", reportingTo: "Associate Product Manager" },

  // 4) Design (UI/UX)
  { name: "Head of Design", code: "HOD", level: 7, department: "Design", reportingTo: "Chief Technology Officer (CTO)" },
  { name: "Design Lead", code: "DLEAD", level: 5, department: "Design", reportingTo: "Head of Design" },
  { name: "Senior Product Designer", code: "SPD", level: 4, department: "Design", reportingTo: "Design Lead" },
  { name: "Product Designer", code: "PD", level: 3, department: "Design", reportingTo: "Senior Product Designer" },
  { name: "UI Designer", code: "UID", level: 2, department: "Design", reportingTo: "Product Designer" },
  { name: "UX Designer", code: "UXD", level: 2, department: "Design", reportingTo: "Product Designer" },
  { name: "Design Intern", code: "DINT", level: 1, department: "Design", reportingTo: "UI Designer" },

  // 5) QA
  { name: "QA Manager", code: "QAM", level: 6, department: "QA", reportingTo: "Director of Engineering" },
  { name: "Test Lead", code: "TLEAD", level: 5, department: "QA", reportingTo: "QA Manager" },
  { name: "Senior QA Engineer", code: "SQAE", level: 4, department: "QA", reportingTo: "Test Lead" },
  { name: "Software Test Engineer", code: "STE", level: 3, department: "QA", reportingTo: "Senior QA Engineer" },
  { name: "QA Engineer", code: "QAE", level: 3, department: "QA", reportingTo: "Software Test Engineer" },
  { name: "QA Intern", code: "QINT", level: 1, department: "QA", reportingTo: "QA Engineer" },

  // 6) DevOps / Infrastructure
  { name: "Infrastructure Manager", code: "INFM", level: 6, department: "DevOps", reportingTo: "Chief Technology Officer (CTO)" },
  { name: "Senior DevOps Engineer", code: "SDO", level: 4, department: "DevOps", reportingTo: "Infrastructure Manager" },
  { name: "Site Reliability Engineer (SRE)", code: "SRE", level: 3, department: "DevOps", reportingTo: "Senior DevOps Engineer" },
  { name: "Cloud Engineer", code: "CENG", level: 3, department: "DevOps", reportingTo: "Senior DevOps Engineer" },
  { name: "DevOps Engineer", code: "DOENG", level: 3, department: "DevOps", reportingTo: "Cloud Engineer" },
  { name: "DevOps Intern", code: "DOINT", level: 1, department: "DevOps", reportingTo: "DevOps Engineer" },

  // 7) HR
  { name: "HR Director", code: "HRD", level: 7, department: "HR", reportingTo: "Chief Human Resources Officer (CHRO)" },
  { name: "HR Manager", code: "HRM", level: 6, department: "HR", reportingTo: "HR Director" },
  { name: "HR Business Partner", code: "HRBP", level: 4, department: "HR", reportingTo: "HR Manager" },
  { name: "Senior HR Executive", code: "SHREX", level: 4, department: "HR", reportingTo: "HR Manager" },
  { name: "HR Executive", code: "HREX", level: 3, department: "HR", reportingTo: "Senior HR Executive" },
  { name: "HR Intern", code: "HRINT", level: 1, department: "HR", reportingTo: "HR Executive" },

  // 8) Finance
  { name: "Finance Director", code: "FIND", level: 7, department: "Finance", reportingTo: "Chief Financial Officer (CFO)" },
  { name: "Finance Manager", code: "FINM", level: 6, department: "Finance", reportingTo: "Finance Director" },
  { name: "Senior Accountant", code: "SACC", level: 4, department: "Finance", reportingTo: "Finance Manager" },
  { name: "Accountant", code: "ACC", level: 3, department: "Finance", reportingTo: "Senior Accountant" },
  { name: "Accounts Executive", code: "ACEX", level: 3, department: "Finance", reportingTo: "Accountant" },
  { name: "Finance Intern", code: "FINT", level: 1, department: "Finance", reportingTo: "Accounts Executive" },

  // 9) Sales
  { name: "Sales Director", code: "SLD", level: 7, department: "Sales", reportingTo: "Chief Operating Officer (COO)" },
  { name: "Regional Sales Manager", code: "RSM", level: 7, department: "Sales", reportingTo: "Sales Director" },
  { name: "Sales Manager", code: "SLM", level: 6, department: "Sales", reportingTo: "Regional Sales Manager" },
  { name: "Business Development Manager", code: "BDM", level: 5, department: "Sales", reportingTo: "Sales Manager" },
  { name: "Business Development Executive", code: "BDE", level: 3, department: "Sales", reportingTo: "Business Development Manager" },
  { name: "Sales Executive", code: "SALEX", level: 3, department: "Sales", reportingTo: "Business Development Manager" },
  { name: "Sales Intern", code: "SINT", level: 1, department: "Sales", reportingTo: "Sales Executive" },

  // 10) Marketing
  { name: "Head of Marketing", code: "HOM", level: 7, department: "Marketing", reportingTo: "Chief Operating Officer (COO)" },
  { name: "Marketing Manager", code: "MKM", level: 6, department: "Marketing", reportingTo: "Head of Marketing" },
  { name: "Digital Marketing Specialist", code: "DMS", level: 3, department: "Marketing", reportingTo: "Marketing Manager" },
  { name: "SEO Specialist", code: "SEO", level: 3, department: "Marketing", reportingTo: "Marketing Manager" },
  { name: "Marketing Executive", code: "MKEX", level: 3, department: "Marketing", reportingTo: "Digital Marketing Specialist" },
  { name: "Marketing Intern", code: "MINT", level: 1, department: "Marketing", reportingTo: "Marketing Executive" },

  // 11) IT Support / Internal IT
  { name: "IT Manager", code: "ITM", level: 6, department: "IT Support", reportingTo: "Chief Technology Officer (CTO)" },
  { name: "System Administrator", code: "SYSA", level: 4, department: "IT Support", reportingTo: "IT Manager" },
  { name: "Network Engineer", code: "NWE", level: 4, department: "IT Support", reportingTo: "IT Manager" },
  { name: "IT Support Executive", code: "ITSE", level: 3, department: "IT Support", reportingTo: "System Administrator" },

  // 12) Operations
  { name: "Operations Director", code: "OPD", level: 7, department: "Operations", reportingTo: "Chief Operating Officer (COO)" },
  { name: "Senior Operations Manager", code: "SOPM", level: 7, department: "Operations", reportingTo: "Operations Director" },
  { name: "Operations Manager", code: "OPM", level: 6, department: "Operations", reportingTo: "Senior Operations Manager" },
  { name: "Operations Executive", code: "OPEX", level: 3, department: "Operations", reportingTo: "Operations Manager" },
];

const designationSeeder = async () => {
  try {
    const departmentNames = [...new Set(
      DESIGNATION_CATALOG
        .map((designation) => designation.department)
        .filter(Boolean),
    )];

    const departments = await Department.find({
      name: { $in: departmentNames },
    })
      .select("_id name")
      .lean();

    const departmentIdByName = new Map(
      departments.map((department) => [department.name, department._id]),
    );

    const unresolvedDepartments = departmentNames.filter((name) => !departmentIdByName.has(name));
    if (unresolvedDepartments.length > 0) {
      console.warn("Designation seeder missing departments:", unresolvedDepartments);
    }

    for (const item of DESIGNATION_CATALOG) {
      const departmentId = item.department ? departmentIdByName.get(item.department) || null : null;

      await Designation.updateOne(
        { name: item.name },
        {
          $set: {
            code: item.code,
            level: item.level,
            department: departmentId,
            description: `${item.name} role`,
            isActive: true,
            updatedBy: null,
          },
          $setOnInsert: {
            name: item.name,
            minSalary: 0,
            maxSalary: 0,
            employeeCount: 0,
            createdBy: null,
          },
        },
        { upsert: true },
      );
    }

    const designationNames = DESIGNATION_CATALOG.map((designation) => designation.name);
    const seededDesignations = await Designation.find({
      name: { $in: designationNames },
    })
      .select("_id name")
      .lean();

    const designationIdByName = new Map(
      seededDesignations.map((designation) => [designation.name, designation._id]),
    );

    for (const item of DESIGNATION_CATALOG) {
      const reportingToId = item.reportingTo ? designationIdByName.get(item.reportingTo) || null : null;

      await Designation.updateOne(
        { name: item.name },
        {
          $set: {
            reportingTo: reportingToId,
          },
        },
      );
    }

    console.log("Designations seeded:", DESIGNATION_CATALOG.length);
  } catch (err) {
    console.error("Error seeding designations:", err);
  }
};

export default designationSeeder;
