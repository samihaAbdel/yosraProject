const UserModel = require("../models/user.model");
const { ObjectId } = require("mongoose").Types; 

module.exports.getAllUsers = async (req, res) => {
  const users = await UserModel.find().select("-password");
  res.status(200).json(users);
};

module.exports.userInfo = async (req, res) => {
  const userId = req.params.id;
//   console.log(userId);

  if (!ObjectId.isValid(userId)) {
    return res.status(400).send(`ID unknown: ${userId}`);
  }

  try {
    const userToFind = await UserModel.findById(userId).select("-password");

    if (!userToFind) {
      return res.status(404).send("User not found");
    }

    // console.log(userToFind);
    res.status(200).json(userToFind);
  } catch (error) {
    console.error("Error fetching user: ", error);
    res.status(500).send("Internal server error");
  }
};



module.exports.updateUser = async (req, res) => {
  const userId = req.params.id;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).send(`ID unknown: ${userId}`);
  }

  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $set: { bio: req.body.bio } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating user: ", err);
    res.status(500).json({ message: err.message });
  }
};


module.exports.deleteUser = async (req, res) => {
 const userId = req.params.id;

 if (!ObjectId.isValid(userId)) {
   return res.status(400).send(`ID unknown: ${userId}`);
 }

  try {
    await UserModel.findByIdAndDelete(userId);
    res.status(200).json({ message: "Successfully deleted." });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
};

module.exports.follow = async (req, res) => {
  if (
    !ObjectId.isValid(req.params.id) ||
    !ObjectId.isValid(req.body.idToFollow)
  )
    return res.status(400).send("ID unknown: " + req.params.id);

  try {
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { following: req.body.idToFollow } },
      { new: true, upsert: true }
    );

   
    await UserModel.findByIdAndUpdate(
      req.body.idToFollow,
      { $addToSet: { followers: req.params.id } },
      { new: true, upsert: true }
    );

    res.send(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};


module.exports.unfollow = async (req, res) => {
  if (
    !ObjectId.isValid(req.params.id) ||
    !ObjectId.isValid(req.body.idToUnfollow)
  )
    return res.status(400).send("ID unknown: " + req.params.id);

  try {
    // Remove from the following list
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { following: req.body.idToUnfollow } },
      { new: true, upsert: true }
    );

    // Remove from the follower list
    await UserModel.findByIdAndUpdate(
      req.body.idToUnfollow,
      { $pull: { followers: req.params.id } },
      { new: true, upsert: true }
    );

    res.send(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
