const PostModel = require("../models/post.model");
const UserModel = require("../models/user.model");
const { uploadErrors } = require("../utils/errors.utils");
const ObjectID = require("mongoose").Types.ObjectId;
const fs = require("fs");
const { pipeline } = require("stream/promises");
const path = require('path');

module.exports.readPost = async (req, res) => {
  try {
    const docs = await PostModel.find().sort({ createdAt: -1 });
    res.status(200).send(docs);
  } catch (err) {
    console.log("Error to get data: " + err);
    res.status(500).send("Error to get data" + err);
  }
}


module.exports.createPost = async (req, res) => {
  let fileName = "";

  if (req.file !== null && req.file !== undefined) {
    try {
     

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
    } catch (err) {
      const errors = uploadErrors(err);
      return res.status(400).json({ errors });
    }

    fileName = `${req.body.posterId}_${Date.now()}.jpg`;
    const filePath = path.join(
      __dirname,
      "..",
      "client",
      "public",
      "uploads",
      "posts"
    );

    try {
      // Ensure directory exists
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }

      // Write file using buffer
      fs.writeFile(path.join(filePath, fileName), req.file.buffer, (err) => {
        if (err) {
          console.error("File upload error:", err);
          return res.status(500).json({ error: "File upload failed" });
        }
      });
    } catch (err) {
      console.error("File upload error:", err);
      return res.status(500).json({ error: "File upload failed" });
    }
  }

  const { posterId, message, video } = req.body;
  const newPost = new PostModel({
    posterId,
    message,
    picture: req.file !== null ? `./uploads/posts/${fileName}` : "",
    video,
    likers: [],
    comments: [],
  });

  try {
    const post = await newPost.save();
    return res.status(201).json(post);
  } catch (err) {
    return res.status(400).send(err);
  }
};
module.exports.updatePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(400).send("ID unknown: " + req.params.id);
  }

  const updatedRecord = {
    message: req.body.message,
  };

  try {
    const updatedPost = await PostModel.findByIdAndUpdate(
      req.params.id,
      { $set: updatedRecord },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).send("Post not found");
    }

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send("An error occurred while updating the post.");
  }
};

module.exports.deletePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown :" + req.params.id);
  try {
    await PostModel.findByIdAndDelete(req.params.id);
    res.status(200).send("deleted !!!!");
  } catch (error) {
    console.log(" Delete error : " + error);
  }
};

module.exports.likePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(400).send("ID unknown: " + req.params.id);
  }

  try {
    const updatedPost = await PostModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likers: req.body.id } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).send("Post not found");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.body.id,
      { $addToSet: { likes: req.params.id } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.status(200).json({ updatedPost, updatedUser });
  } catch (err) {
    console.error("Like post error:", err);
    return res.status(500).send("An error occurred while liking the post.");
  }
};

module.exports.unlikePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(400).send("ID unknown: " + req.params.id);
  }

  try {
    const updatedPost = await PostModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { likers: req.body.id } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).send("Post not found");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.body.id,
      { $pull: { likes: req.params.id } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.status(200).json({ updatedPost, updatedUser });
  } catch (err) {
    console.error("Like post error:", err);
    return res.status(500).send("An error occurred while liking the post.");
  }
};

module.exports.commentPost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    const comment = await PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            commenterId: req.body.commenterId,
            commenterPseudo: req.body.commenterPseudo,
            text: req.body.text,
            timestamp: new Date().getTime(),
          },
        },
      },
      { new: true }
    );

    res.status(200).send(comment);
  } catch (err) {
    return res.status(400).send(err);
  }
};

module.exports.editCommentPost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown: " + req.params.id);

  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    const theComment = post.comments.find((comment) =>
      comment._id.equals(req.body.commentId)
    );

    if (!theComment) return res.status(404).send("Comment not found");

    theComment.text = req.body.text;

    await post.save();
    return res.status(200).send(post);
  } catch (err) {
    return res.status(500).send(err);
  }
};

  module.exports.deleteCommentPost = async (req, res) => {
    if (!ObjectID.isValid(req.params.id))
      return res.status(400).send("ID unknown : " + req.params.id);

    try {
      const post = await PostModel.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            comments: {
              _id: req.body.commentId,
            },
          },
        },
        { new: true })
      res.status(200).send(post);
        
   
    } catch (err) {
      return res.status(400).send(err);
    }
  }
