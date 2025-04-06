// As a user, I want to sign up, log in, log out, and edit my profile.
// Profile information includes first and last name, email, profile picture, and phone number.
// Authentication should be handled with a proper JWT setup.
//
// /api/user/login

// As a user, I want to sign up, log in, log out, and edit my profile.
// Profile information includes first and last name, email, profile picture, and phone number.
// Authentication should be handled with a proper JWT setup.
//
// /api/user/logout

import { NextResponse } from "next/server";
import {
  setCookie,
  deleteCookie,
  comparePassword,
  generateToken,
  withAuth,
} from "@/utils/auth";
import { prisma } from "@/utils/db";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // check if missing values for db
    if (!email || !password) {
      return NextResponse.json(
        { error: "data missing, plz fill in all blanks" },
        { status: 400 },
      );
    }

    // check if email already exist in db
    const user = await prisma.User.findUnique({
      where: { email: email },
    });

    if (user == null) {
      return NextResponse.json(
        { error: "email needs to be registered" },
        { status: 401 },
      );
    }

    // verify password
    if (!comparePassword(password, user.password)) {
      return NextResponse.json({ error: "wrong password" }, { status: 402 });
    }

    //generate JWT
    const JWT = generateToken({ id: user.id, role: user.role });

    // Set the JWT in a cookie
    const response = NextResponse.json({
      message: "User login successfully",
      user: user,
    });
    setCookie(response, JWT); // Store the token in a cookie for the user

    return response;
  } catch (error) {
    // unexpected error
    console.error("Error occurred:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 },
    );
  }
}

async function logout(request) {
  try {
    void request;
    const response = NextResponse.json({ message: "Logged out successfully" });
    deleteCookie(response);

    return response;
  } catch (error) {
    console.log("Error during logout:", error);
    return NextResponse.json({ message: "Error logging out" }, { status: 500 });
  }
}

export const DELETE = withAuth(logout);
