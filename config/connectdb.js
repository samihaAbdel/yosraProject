const mongoose = require('mongoose');
const connectdb = async () => {
    try {
    await mongoose.connect(process.env.DB_URI);
    console.log("DB connected!!!!");
    } catch (error) {
        console.log(`Can't connect.... ${error.message}`);
        process.exit(1)
}
};

module.exports = connectdb;