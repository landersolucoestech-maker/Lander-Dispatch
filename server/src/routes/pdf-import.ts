import { Router, type IRouter } from "express";
import multer from "multer";
// pdf-parse v1: import from lib directly to avoid the test-runner auto-run bug
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — no types for the sub-path
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import OpenAI from "openai";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are accepted."));
  },
});

function getOpenAIConfiguration(): {
  apiKey: string;
  baseURL?: string;
  model: string;
} | null {
  const apiKey = (
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ??
    process.env.OPENAI_API_KEY
  )?.trim();
  const model = process.env.OPENAI_PDF_EXTRACTION_MODEL?.trim();

  if (!apiKey || !model) return null;

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim();
  return {
    apiKey,
    model,
    ...(baseURL ? { baseURL } : {}),
  };
}

function createSystemPrompt(): string {
  const currentYear = new Date().getUTCFullYear();

  return `You are a freight dispatch data extraction assistant.
You will receive text extracted from a trucking document — which may be a:
- Central Dispatch dispatch sheet / vehicle dispatch order
- Rate confirmation (rate con)
- Bill of Lading (BOL)
- Carrier packet or load tender

Your job: extract every piece of load information present and return ONLY valid JSON — no markdown, no explanation, no code fences.

Return this exact JSON shape (use null for any field not found):
{
  "documentType": "dispatch_sheet" | "rate_confirmation" | "bol" | "unknown",
  "status": string | null,
  "dispatchDate": "YYYY-MM-DD" | null,
  "carrierName": string | null,
  "brokerName": string | null,
  "pickupName": string | null,
  "pickupAddress": string | null,
  "pickupCity": string | null,
  "pickupState": string | null,
  "pickupZip": string | null,
  "pickupPhone": string | null,
  "pickupDate": "YYYY-MM-DD" | null,
  "pickupDeadline": "YYYY-MM-DD" | null,
  "pickupInstructions": string | null,
  "deliveryName": string | null,
  "deliveryAddress": string | null,
  "deliveryCity": string | null,
  "deliveryState": string | null,
  "deliveryZip": string | null,
  "deliveryPhone": string | null,
  "deliveryDate": "YYYY-MM-DD" | null,
  "deliveryDeadline": "YYYY-MM-DD" | null,
  "deliveryInstructions": string | null,
  "miles": number | null,
  "rate": number | null,
  "paymentMethod": string | null,
  "dispatchInstructions": string | null,
  "vehicles": [
    {
      "vehicleNumber": number,
      "year": string | null,
      "make": string | null,
      "model": string | null,
      "type": string | null,
      "color": string | null,
      "plate": string | null,
      "vin": string | null,
      "lotNumber": string | null
    }
  ],
  "referenceNumbers": string[] | null,
  "notes": string | null
}

Rules:
- Parse ALL vehicles listed — Central Dispatch sheets often list multiple vehicles.
- For dispatch_sheet: status = "Dispatched".
- For rate_confirmation: extract rate, payment terms, reference numbers.
- For bol: focus on pickup/delivery details and vehicle info.
- Dates must be YYYY-MM-DD. Month/day without year → use ${currentYear}.
- Rate: numeric only, no $ sign. "2,400.00" → 2400.
- If a field truly cannot be determined, use null — never guess.`;
}

router.post("/loads/parse-pdf", upload.single("pdf"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file uploaded." });
    return;
  }

  const aiConfiguration = getOpenAIConfiguration();
  if (!aiConfiguration) {
    res.status(503).json({
      error:
        "AI PDF extraction is not configured. Set OPENAI_API_KEY and OPENAI_PDF_EXTRACTION_MODEL.",
    });
    return;
  }

  let extractedText = "";
  try {
    const parsed = await (pdfParse as (buf: Buffer) => Promise<{ text: string; numpages: number }>)(
      req.file.buffer,
    );
    extractedText = parsed.text?.trim() ?? "";
  } catch (err: unknown) {
    res.status(422).json({
      error: "Could not read PDF. File may be corrupted or password-protected.",
      detail: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  if (!extractedText || extractedText.length < 30) {
    res.status(422).json({
      error:
        "PDF appears to be a scanned image with no readable text. Please use a digital (non-scanned) PDF.",
    });
    return;
  }

  const openai = new OpenAI({
    apiKey: aiConfiguration.apiKey,
    ...(aiConfiguration.baseURL ? { baseURL: aiConfiguration.baseURL } : {}),
  });
  const textForAI = extractedText.slice(0, 8000);

  try {
    const completion = await openai.chat.completions.create({
      model: aiConfiguration.model,
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: createSystemPrompt() },
        {
          role: "user",
          content: `Extract load data from this document:\n\n---\n${textForAI}\n---`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      res.status(422).json({ error: "AI returned unparseable response. Try again." });
      return;
    }

    res.json({ extracted, charCount: extractedText.length });
  } catch (err: unknown) {
    req.log.error({ err }, "AI PDF extraction failed");
    res.status(502).json({ error: "AI extraction failed." });
  }
});

export default router;
