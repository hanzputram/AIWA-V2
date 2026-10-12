import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SavedContact {
  phone: string; // digits only
  name: string;
  company?: string;
  project?: string;
  budget?: string;
  stage?: string;
  address?: string;
  notes?: string;
  updatedAt: number;
}

function getContactsFilePath(): string {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "contacts.json");
}

export function loadSavedContacts(): Record<string, SavedContact> {
  try {
    const filePath = getContactsFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading contacts.json:", err);
  }
  return {};
}

export function saveContactsFile(contacts: Record<string, SavedContact>) {
  try {
    const filePath = getContactsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing contacts.json:", err);
  }
}

export async function GET() {
  const contacts = loadSavedContacts();
  return NextResponse.json({ ok: true, contacts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, company, project, budget, stage, address, notes } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { error: "phone and name are required" },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (!cleanPhone) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const contacts = loadSavedContacts();
    const updatedContact: SavedContact = {
      phone: cleanPhone,
      name: String(name).trim(),
      company: company ? String(company).trim() : String(name).trim(),
      project: project ? String(project).trim() : "-",
      budget: budget ? String(budget).trim() : "-",
      stage: stage || "proposal",
      address: address ? String(address).trim() : "",
      notes: notes ? String(notes).trim() : "",
      updatedAt: Math.floor(Date.now() / 1000),
    };

    contacts[cleanPhone] = updatedContact;
    saveContactsFile(contacts);

    return NextResponse.json({ ok: true, contact: updatedContact });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
