import { NextRequest, NextResponse } from "next/server";
import { validateSubmission } from "@/lib/schemas/submission";

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();

    // Extract the fields
    const uploadedBy = formData.get("uploadedBy") as string;
    const country = formData.get("country") as string;
    const email = formData.get("email") as string;
    const attachments = formData.getAll("attachments") as File[];

    // Convert attachments to the format expected by our schema
    const processedAttachments = await Promise.all(
      attachments.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return {
          fieldname: "attachments",
          originalname: file.name,
          encoding: "7bit",
          mimetype: file.type,
          buffer: Buffer.from(buffer),
          size: file.size,
        };
      })
    );

    // Validate the submission
    const validationResult = validateSubmission({
      uploadedBy,
      country,
      email,
      attachments: processedAttachments,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Here you would typically process the submission (e.g., save to database, send email, etc.)
    // For the challenge, we'll just return a success response
    return NextResponse.json(
      {
        success: true,
        message: "Submission received successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing submission:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
