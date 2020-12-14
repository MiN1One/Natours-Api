const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please, tell us your name!'],
    },
    email: {
        type: String,
        required: [true, 'Please, enter your email address'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Entered email is not valid']
    },
    photo: String,
    role: {
        type: String,
        enum: ['admin', 'user', 'tour-guide', 'lead-guide'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please, set your password.'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please, confirm your password'],
        validate: {
            // This works only on CREATE and SAVE methods
            validator: function(pasC) {
                return pasC === this.password;
            },
            message: "Wrong password confirmation. The passwords are not the same"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    // if the password is not modified stop the function
    if (!this.isModified('password')) return next();

    // Hash the password
    this.password = await bcrypt.hash(this.password, 12);

    // Delete password confirmation
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function(next) {
    // if the password is not modified stop the function
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function(next) {
    this.find({ active: {$ne: false} });
    next();
});

// ***********************************************
//                 INSTANCE METHODS
// ***********************************************

userSchema.methods.checkPassword = async function(candidatePass, userPass) {
    return await bcrypt.compare(candidatePass, userPass);
};

userSchema.methods.wasPasswordChanged = function(JWTT) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        // FALSE means password was not changed
        return JWTT < changedTimestamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;