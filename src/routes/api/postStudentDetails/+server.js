import { json } from "@sveltejs/kit";

export const POST = async ({ request }) => {
    const data = await request.json();

    const name = data.name;

    if (!name) {
        return json(
            {
                success: false,
                message: "Name is required",
            },
            { status: 400 }
        );
    }

    console.log("Received name:", name);

    return json({
        success: true,
        message: `Hello ${name}, your name was submitted`,
    });
};