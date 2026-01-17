import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    // Get all users (excluding password_hash for security)
    const result = await query(
      `SELECT 
        id, username, email, full_name, role, department, phone, academic_title, 
        is_active, created_at, updated_at, last_login
      FROM users 
      ORDER BY created_at DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      username, 
      email, 
      full_name, 
      role, 
      department, 
      phone, 
      academic_title, 
      is_active,
      password // Optional: for password updates
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (department !== undefined) {
      updateFields.push(`department = $${paramIndex++}`);
      values.push(department);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (academic_title !== undefined) {
      updateFields.push(`academic_title = $${paramIndex++}`);
      values.push(academic_title);
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    if (password !== undefined && password !== "") {
      // Hash the new password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      updateFields.push(`password_hash = $${paramIndex++}`);
      values.push(password_hash);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Always update updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add id as the last parameter
    values.push(id);
    paramIndex++;

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex - 1}
      RETURNING id, username, email, full_name, role, department, phone, academic_title, is_active, created_at, updated_at, last_login
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0], message: "تم تحديث المستخدم بنجاح" });
  } catch (error: any) {
    console.error("Error updating user:", error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint?.includes('username')) {
        return NextResponse.json(
          { error: "اسم المستخدم مسجل مسبقاً" },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('email')) {
        return NextResponse.json(
          { error: "البريد الإلكتروني مسجل مسبقاً" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update user", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Check if user exists
    const checkResult = await query(`SELECT id, username FROM users WHERE id = $1`, [parseInt(id)]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user (CASCADE will handle related records)
    await query(`DELETE FROM users WHERE id = $1`, [parseInt(id)]);

    return NextResponse.json({ message: "تم حذف المستخدم بنجاح" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    );
  }
}
