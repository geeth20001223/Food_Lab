import { NextResponse } from "next/server";

const SPICES = [
  "Chilli Powder",
  "Turmeric Powder",
  "Pepper Powder",
  "Curry Powder",
  "Cinnamon",
  "Cloves",
  "Cardamom",
  "Ginger",
  "Garlic",
  "Fenugreek",
  "Coriander",
  "Cumin Seeds",
  "Mustard Seeds",
  "Other Spices",
];

export async function GET() {
  return NextResponse.json(SPICES);
}
