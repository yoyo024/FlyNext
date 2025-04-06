// As a user, I want to sign up, log in, log out, and edit my profile.
// Profile information includes first and last name, email, profile picture, and phone number.
// Authentication should be handled with a proper JWT setup.
//
// /api/user/signup

import { NextResponse } from "next/server";
import { setCookie, hashPassword, generateToken, withAuth } from "@/utils/auth";
import { prisma } from "@/utils/db";
import { Role } from "@prisma/client";

export async function POST(request) {
  try {
    var {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      profilePicture,
      role,
    } = await request.json();

    // check types for db
    if (typeof email !== "string") {
      console.log(email, password);
      return NextResponse.json(
        { error: "Email must be a string" },
        { status: 400 },
      );
    }
    if (typeof password !== "string") {
      return NextResponse.json(
        { error: "Password must be a string" },
        { status: 400 },
      );
    }
    if (typeof firstName !== "string") {
      return NextResponse.json(
        { error: "First name must be a string" },
        { status: 400 },
      );
    }
    if (typeof lastName !== "string") {
      return NextResponse.json(
        { error: "Last name must be a string" },
        { status: 400 },
      );
    }
    if (phoneNumber && typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "phone number must be a string" },
        { status: 400 },
      );
    }
    if (profilePicture) {
      try {
        JSON.parse(profilePicture);
      } catch (error) {
        console.log(error);
        return NextResponse.json(
          { error: "Profile picture must be a valid JSON" },
          { status: 400 },
        );
      }
    }
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of: ${Object.values(Role).join(", ")}`,
        },
        { status: 400 },
      );
    }

    email = email.trim();
    password = password.trim();
    firstName = firstName.trim();
    lastName = lastName.trim();

    // check if missing values for db
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "data missing, plz fill in all blanks" },
        { status: 400 },
      );
    }

    // check if email already exist in db
    const check_email = await prisma.User.findUnique({
      where: { email: email },
    });

    if (check_email != null) {
      return NextResponse.json(
        { error: "email has been used" },
        { status: 401 },
      );
    }

    // store user info into db
    const account = await prisma.User.create({
      data: {
        email: email,
        password: hashPassword(password),
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        profilePicture: profilePicture,
        role: role,
      },
      select: {
        id: true,
        role: true,
      },
    });

    //generate JWT
    const JWT = generateToken(account);

    // Set the JWT in a cookie
    const response = NextResponse.json({
      message: "User created successfully",
      user: account,
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

// As a user, I want to sign up, log in, log out, and edit my profile.
// Profile information includes first and last name, email, profile picture, and phone number.
// Authentication should be handled with a proper JWT setup.
//
// /api/user/edit

async function PUT_edit(request) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      profilePicture,
    } = await request.json();

    if (
      !firstName &&
      !lastName &&
      !email &&
      !password &&
      !phoneNumber &&
      !profilePicture
    ) {
      return NextResponse.json(
        { error: "No profile data to update" },
        { status: 400 },
      );
    }

    const userId = request.user.id;

    // update info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashPassword(password),
        phoneNumber: phoneNumber,
        profilePicture: profilePicture,
      },
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: updatedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("Error updating profile:", error);
    return NextResponse.json(
      { message: "Error updating profile" },
      { status: 500 },
    );
  }
}

async function GET_acc(request) {
  try {
    const userId = request.user.id;

    // get account info
    const acc = await prisma.user.findUnique({
      where: { id: userId },
    });

    return NextResponse.json(
      {
        message: "Account info got successfully",
        user: acc,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("Error getting profile:", error);
    return NextResponse.json(
      { message: "Error getting profile" },
      { status: 500 },
    );
  }
}

export const PUT = withAuth(PUT_edit);
export const GET = withAuth(GET_acc);
