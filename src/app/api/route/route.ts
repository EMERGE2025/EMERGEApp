// src/app/api/route/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { start, end, mode, avoid_polygons } = body;

    // Check for missing parameters
    if (!start || !end || !mode) {
      return NextResponse.json(
        { error: "Missing start, end, or mode" },
        { status: 400 }
      );
    }

    // Get the API key securely from environment variables
    const apiKey = process.env.OPENROUTE_API;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured on server" },
        { status: 500 }
      );
    }

    // This is the external API call, happening on the server
    const orsUrl = `https://api.openrouteservice.org/v2/directions/${mode}/geojson`;

    // Build the request body
    const requestBody: any = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };

    // Add avoid_polygons if provided
    if (avoid_polygons) {
      requestBody.options = {
        avoid_polygons: avoid_polygons,
      };
      console.log("Adding avoid_polygons to route request:", avoid_polygons);
    }

    const orsBody = JSON.stringify(requestBody);

    const orsResponse = await fetch(orsUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey, // Use the secure key
        "Content-Type": "application/json",
        Accept:
          "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
      },
      body: orsBody,
    });

    // Check if OpenRouteService returned an error
    if (!orsResponse.ok) {
      const errorData = await orsResponse.json();
      console.error("OpenRouteService API Error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Error from OpenRouteService" },
        { status: orsResponse.status }
      );
    }

    // Send the successful data back to the client
    const data = await orsResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Internal server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}