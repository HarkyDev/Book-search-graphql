const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return await User.findById(context.user._id);
      }

      throw new AuthenticationError("Please Log in");
    },
  },

  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("incorrect email");
      }

      const userPass = await user.isCorrectPassword(password);

      if (!userPass) {
        throw new AuthenticationError("incorrect password");
      }

      const signInKey = signToken(user);
      return { signInKey, user };
    },

    addUser: async (parent, args, context) => {
      try {
        const user = await User.create(args);

        const signInKey = signToken(user);
        return { user, signInKey };
      } catch (error) {
        console.error(error.message);
      }
    },

    saveBook: async (parent, { book }, context) => {
      const { _id } = context.user;
      if (context.user) {
        try {
          const myUpdatedBook = await User.findOneAndUpdate(
            { _id },
            { $push: { savedBooks: book } },
            { new: true }
          ).populate("savedBooks");

          return myUpdatedBook;
        } catch (error) {
          console.error(error.message);
        }
      }
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );

        return updatedUser;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },
};

module.exports = resolvers;
