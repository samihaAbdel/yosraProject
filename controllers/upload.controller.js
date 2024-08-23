const UserModel = require("../models/user.model");
const fs = require("fs");
const { promisify } = require("util");
const path = require("path");
const { uploadErrors } = require("../utils/errors.utils");

const writeFileAsync = promisify(fs.writeFile);

module.exports.uploadProfil = async (req, res) => {
  try {
    if (!req.file) {
      throw Error("No file uploaded");
    }

    // Log file properties for debugging
    console.log("File properties:", req.file);

    if (
      req.file.mimetype !== "image/jpg" &&
      req.file.mimetype !== "image/png" &&
      req.file.mimetype !== "image/jpeg"
    ) {
      throw Error("invalid file");
    }

    if (req.file.size > 500000) {
      throw Error("max size");
    }

    const fileName = req.body.name + ".jpg";
    const filePath = path.join(
      __dirname,
      "../client/public/uploads/profil",
      fileName
    );

    // Write buffer to file
    await writeFileAsync(filePath, req.file.buffer);
    console.log("File successfully saved");

    // Update user profile picture path in the database
    const user = await UserModel.findByIdAndUpdate(
      req.body.userId,
      {
        $set: { picture: "./uploads/profil/" + fileName },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).send(user);
  } catch (err) {
    console.error(err); 
    const errors = uploadErrors(err);
    res.status(400).json({ errors });
  }
};
