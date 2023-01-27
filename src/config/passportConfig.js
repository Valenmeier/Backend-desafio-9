import passport from "passport";
import local from "passport-local";
import userModel from "../dao/models/usersModel.js";
import GitHubStrategy from "passport-github2";
import GoogleStrategy from "passport-google-oauth2";
import { createHash, isValidPassword } from "../utils.js";

const LocalStrategy = local.Strategy;

const initializePassport = () => {
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID:
          "398333993561-sngbcuiggfce5eccss5p13cpl37ggohm.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "http://localhost:8080/session/googlecallback",
        passReqToCallback: true,
      },
      async (request, accessToken, refreshToken, profile, done) => {
        console.log(profile);
        try {
          const user = await userModel.findOne({ email: profile._json.email });
          if (user) {
            console.log("User already exits");
            return done(null, user);
          }

          const newUser = {
            name: profile._json.given_name,
            lastName: profile._json.family_name,
            user:profile._json.given_name,
            email: profile._json.email,
            password: "",
          };
          const result = await userModel.create(newUser);
          return done(null, result);
        } catch (error) {
          return done("error to login with github" + error);
        }
      }
    )
  );

  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: "Iv1.34ee5890827cdd0f",
        clientSecret: "d850e1513b15048d7be01b42e5123da07633fff5",
        callbackURL: "http://localhost:8080/session/githubcallback",
      },
      async (accessToken, refreshToken, profile, done) => {
       

        try {
          const user = await userModel.findOne({ email: profile._json.email });
          if (user) {
            console.log("User already exits");
            return done(null, user);
          }

          const newUser = {
            user: profile._json.name,
            name: profile._json.name,
            last_name: "",
            email: profile._json.email,
            password: "",
          };
          const result = await userModel.create(newUser);
          return done(null, result);
        } catch (error) {
          return done("error to login with github" + error);
        }
      }
    )
  );

  passport.use(
    "login",
    new LocalStrategy(
      {
        usernameField: "email",
      },
      async (username, password, done) => {
        try {
          const user = await userModel
            .findOne({ email: username })
            .lean()
            .exec();
          if (!user) {
            return done(null, false);
          }
          if (!isValidPassword(user, password)) return done(null, false);
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  passport.use(
    "register",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        let userNew = req.body;
        try {
          const user = await userModel.findOne({ email: username });

          if (user) {
            console.log("Usuario Existente");
            return done(null, false);
          }
          if (
            userNew.email.includes(`_admin`) &&
            userNew.password == "SoyAdminPapa"
          ) {
            let asignarRol = {
              ...userNew,
              rol: "admin",
            };
            userNew = asignarRol;
          } else {
            let asignarRol = {
              ...userNew,
              rol: "user",
            };
            userNew = asignarRol;
          }
          const hashUser = {
            ...userNew,
            password: createHash(userNew.password),
          };
          const result = await userModel.create(hashUser);
          return done(null, result);
        } catch (error) {
          return done("Error al obtener usuario");
        }
      }
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
    const user = await userModel.findById(id);
    done(null, user);
  });
};

export default initializePassport;
