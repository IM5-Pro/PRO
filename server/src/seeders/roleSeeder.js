import roles from "../constants/roles.js";

const roleSeeder = async () => {
  console.log("Roles seeded:");
  console.log(Object.values(roles));
};

export default roleSeeder;