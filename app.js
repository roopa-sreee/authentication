const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => console.log("Server is Running at port 3000"));
  } catch (error) {
    console.log(`Db Error : ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `
    SELECT * FROM user WHERE username='${username}'
    `;
  const addUserQuery = `
  INSERT INTO 
      user(username,name,password,gender,location)
  VALUES (
      '${$username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'
    );`;

  const dbUser = await db.get(selectUserQuery);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    await db.run(addUserQuery);
    response.status(200);
    response.send("User created successfully");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * FROM user WHERE username ='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "SECRET_TOKEN");
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `
        SELECT * 
        FROM user
        WHERE username='${username}'`;
  const updatePassword = `
        UPDATE user 
        SET password='${hashedPassword}'
        WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        await db.run(updatePassword);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
