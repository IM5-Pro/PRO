import serverlessExpress from "@codegenie/serverless-express";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";

let serverlessExpressInstance;

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();

  if (!serverlessExpressInstance) {
    serverlessExpressInstance = serverlessExpress({ app });
  }

  return serverlessExpressInstance(event, context);
};
