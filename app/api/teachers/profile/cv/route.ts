import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// GET - Fetch user CV information
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // Create user_cv table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_cv (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          gender VARCHAR(50),
          nationality VARCHAR(50),
          marital_status VARCHAR(50),
          birth_date DATE,
          address TEXT,
          languages TEXT,
          skills TEXT,
          previous_experience TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error: any) {
      console.error("Error creating user_cv table:", error);
    }

    // Fetch CV data
    const result = await query(
      `SELECT gender, nationality, marital_status, birth_date, address, languages, skills, previous_experience
       FROM user_cv
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        gender: "",
        nationality: "",
        maritalStatus: "",
        birthDate: "",
        address: "",
        languages: "",
        skills: "",
        previousExperience: "",
      }, { status: 200 });
    }

    const cvData = result.rows[0];
    // Format birth_date to YYYY-MM-DD if it exists
    let formattedBirthDate = "";
    if (cvData.birth_date) {
      const date = new Date(cvData.birth_date);
      if (!isNaN(date.getTime())) {
        formattedBirthDate = date.toISOString().split('T')[0];
      }
    }
    
    return NextResponse.json({
      gender: cvData.gender || "",
      nationality: cvData.nationality || "",
      maritalStatus: cvData.marital_status || "",
      birthDate: formattedBirthDate,
      address: cvData.address || "",
      languages: cvData.languages || "",
      skills: cvData.skills || "",
      previousExperience: cvData.previous_experience || "",
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching CV data:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب بيانات السيرة الذاتية" },
      { status: 500 }
    );
  }
}

// PATCH - Update user CV information
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gender, nationality, maritalStatus, birthDate, address, languages, skills, previousExperience } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // Create user_cv table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_cv (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          gender VARCHAR(50),
          nationality VARCHAR(50),
          marital_status VARCHAR(50),
          birth_date DATE,
          address TEXT,
          languages TEXT,
          skills TEXT,
          previous_experience TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error: any) {
      console.error("Error creating user_cv table:", error);
    }

    // Use UPSERT (INSERT ... ON CONFLICT UPDATE)
    const result = await query(
      `INSERT INTO user_cv (user_id, gender, nationality, marital_status, birth_date, address, languages, skills, previous_experience, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET
         gender = EXCLUDED.gender,
         nationality = EXCLUDED.nationality,
         marital_status = EXCLUDED.marital_status,
         birth_date = EXCLUDED.birth_date,
         address = EXCLUDED.address,
         languages = EXCLUDED.languages,
         skills = EXCLUDED.skills,
         previous_experience = EXCLUDED.previous_experience,
         updated_at = CURRENT_TIMESTAMP
       RETURNING gender, nationality, marital_status, birth_date, address, languages, skills, previous_experience`,
      [userId, gender || null, nationality || null, maritalStatus || null, birthDate || null, address || null, languages || null, skills || null, previousExperience || null]
    );

    // Format birth_date to YYYY-MM-DD if it exists
    let formattedBirthDate = "";
    if (result.rows[0].birth_date) {
      const date = new Date(result.rows[0].birth_date);
      if (!isNaN(date.getTime())) {
        formattedBirthDate = date.toISOString().split('T')[0];
      }
    }
    
    return NextResponse.json(
      {
        message: "تم حفظ بيانات السيرة الذاتية بنجاح",
        cv: {
          gender: result.rows[0].gender || "",
          nationality: result.rows[0].nationality || "",
          maritalStatus: result.rows[0].marital_status || "",
          birthDate: formattedBirthDate,
          address: result.rows[0].address || "",
          languages: result.rows[0].languages || "",
          skills: result.rows[0].skills || "",
          previousExperience: result.rows[0].previous_experience || "",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating CV data:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حفظ بيانات السيرة الذاتية" },
      { status: 500 }
    );
  }
}
