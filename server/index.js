import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import roleSeeder from "./src/seeders/roleSeeder.js";
import departmentSeeder from "./src/seeders/departmentSeeder.js";
import permissionSeeder from "./src/seeders/permissionSeeder.js";
import designationSeeder from "./src/seeders/designationSeeder.js";
import shiftSeeder from "./src/seeders/shiftSeeder.js";
import { initializeScheduledJobs } from "./src/services/schedulerService.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  (async () => {
    await roleSeeder();
    await permissionSeeder();
    await departmentSeeder();
    await designationSeeder();
    await shiftSeeder();
    initializeScheduledJobs();
  })();
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is Running at ${PORT}`);
  });
}

export default app;
