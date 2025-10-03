const { QueryTypes } = require("sequelize");
const sequelize = require("./dbConnection");

const unique = async function (name, value, params) {
  const records = await sequelize.query(
    `SELECT COUNT(id) AS count FROM ${params[0]} WHERE ${name}='${value}'`,
    { type: QueryTypes.RAW }
  );
  console.log(name, value, params);
  console.log("records = ", records[0][0].count);
  if (records[0][0].count > 0) {
    console.log("failed");
    return true;
  } else {
    return false;
  }
};
module.exports = { unique };
