const db = require("../models"); // Adjust the path as necessary
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const login = async (req, res) => {
  const { email, password } = req.body;
  // Check if the user exists
  if ((!email, !password)) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  // count the users
  const count = await db.User.count();
  if (count === 0) {
    // craete new user
    const newUser = await db.User.create({
      email: email,
      password: password,
    });
    return res.status(StatusCodes.CREATED).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        password: newUser.password,
      },
    });
  }
  // Find the user
  const user = await db.User.findOne({ where: { email , password } });
  // compare the password
//   if (user.defaultValue.password !== password) {
//     throw new CustomError.BadRequestError("Invalid credentials");
//   }
  // Return the user data
  return res.status(StatusCodes.OK).json(
    {user}
  );
};

module.exports = {
  login,
};
