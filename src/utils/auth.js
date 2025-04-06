import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { parse } from "cookie";

export function hashPassword(password) {
  return bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS));
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY_TIME,
    },
  );
}
const isLocalhost = process.env.HOST?.includes("localhost") || process.env.NODE_ENV !== "production";

export function setCookie(response, token) {
  response.cookies.set("accessToken", token, {
    httpOnly: true, // The cookie only accessible by the web server, provides security
    secure: !isLocalhost,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

export function deleteCookie(response) {
  response.cookies.delete("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: -1,
    path: "/",
  });
}

export function withAuth(handler) {
  return async function (request, x) {
    try {
      const cookieHeader = request.headers.get("cookie");
      if (!cookieHeader) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const cookies = parse(cookieHeader);
      const token = cookies.accessToken;

      if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      // verify token
      const user = verifyToken(token);
      if (!user) {
        return NextResponse.json({ message: "Invalid token" }, { status: 403 });
      }

      // Attach user info to request
      request.user = user;

      // Proceed to actual API handler
      return handler(request, x);
    } catch (error) {
      console.log("Authentication error", error);
      return NextResponse.json(
        { message: "Authentication error" },
        { status: 500 },
      );
    }
  };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    void error;
    return null;
  }
}
