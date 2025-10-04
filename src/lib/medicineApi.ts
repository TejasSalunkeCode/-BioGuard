// Medicine API integration using OpenFDA and RxNav APIs
const OPENFDA_BASE_URL = "https://api.fda.gov/drug";
const RXNAV_BASE_URL = "https://rxnav.nlm.nih.gov/REST";

export interface MedicineInfo {
  name: string;
  genericName?: string;
  usage: string;
  dosage: string;
  sideEffects: string[];
  interactions: string[];
  alternatives: string[];
  warnings: string[];
}

// Search medicine using OpenFDA
export async function searchMedicine(medicineName: string): Promise<MedicineInfo> {
  try {
    const searchQuery = medicineName.trim().toLowerCase();
    
    // Search in OpenFDA database
    const fdaResponse = await fetch(
      `${OPENFDA_BASE_URL}/label.json?search=openfda.brand_name:"${searchQuery}"+openfda.generic_name:"${searchQuery}"&limit=1`
    );

    if (!fdaResponse.ok) {
      // Fallback to RxNorm for basic info
      return await getRxNormInfo(searchQuery);
    }

    const fdaData = await fdaResponse.json();
    
    if (!fdaData.results || fdaData.results.length === 0) {
      return await getRxNormInfo(searchQuery);
    }

    const result = fdaData.results[0];
    
    return {
      name: result.openfda?.brand_name?.[0] || medicineName,
      genericName: result.openfda?.generic_name?.[0],
      usage: extractUsage(result),
      dosage: extractDosage(result),
      sideEffects: extractSideEffects(result),
      interactions: extractInteractions(result),
      alternatives: await getAlternatives(result.openfda?.generic_name?.[0] || searchQuery),
      warnings: extractWarnings(result)
    };
  } catch (error) {
    console.error("Error fetching medicine data:", error);
    throw new Error("Failed to fetch medicine information. Please try again.");
  }
}

// Get basic info from RxNorm as fallback
async function getRxNormInfo(medicineName: string): Promise<MedicineInfo> {
  try {
    const response = await fetch(
      `${RXNAV_BASE_URL}/drugs.json?name=${encodeURIComponent(medicineName)}`
    );
    
    if (!response.ok) {
      throw new Error("Medicine not found");
    }

    const data = await response.json();
    
    if (!data.drugGroup?.conceptGroup) {
      throw new Error("Medicine not found in database");
    }

    return {
      name: medicineName,
      usage: "Detailed usage information not available. Please consult your healthcare provider.",
      dosage: "Dosage should be determined by your healthcare provider based on your specific condition.",
      sideEffects: ["Consult product labeling or healthcare provider for side effect information"],
      interactions: [],
      alternatives: [],
      warnings: ["Always consult your healthcare provider before taking any medication"]
    };
  } catch (error) {
    throw new Error("Medicine not found in our database. Please check the spelling or try a different name.");
  }
}

// Get alternative medicines
async function getAlternatives(genericName: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${RXNAV_BASE_URL}/rxcui.json?name=${encodeURIComponent(genericName)}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const rxcui = data.idGroup?.rxnormId?.[0];
    
    if (!rxcui) return [];

    const relatedResponse = await fetch(
      `${RXNAV_BASE_URL}/rxcui/${rxcui}/related.json?tty=SBD+BPCK`
    );
    
    if (!relatedResponse.ok) return [];
    
    const relatedData = await relatedResponse.json();
    const alternatives = (relatedData.relatedGroup?.conceptGroup
      ?.flatMap((group: any) => group.conceptProperties || [])
      .map((concept: any) => concept.name as string)
      .filter((name: string) => name && name.length < 50)
      .slice(0, 5) || []) as string[];

    return alternatives;
  } catch {
    return [];
  }
}

// Extract functions for parsing FDA data
function extractUsage(result: any): string {
  const indications = result.indications_and_usage?.[0] || 
                     result.purpose?.[0] ||
                     result.description?.[0];
  
  if (!indications) return "Usage information not available. Consult your healthcare provider.";
  
  // Clean up the text (remove excessive whitespace and truncate)
  return indications
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500) + (indications.length > 500 ? '...' : '');
}

function extractDosage(result: any): string {
  const dosage = result.dosage_and_administration?.[0] ||
                result.dosage?.[0];
  
  if (!dosage) return "Dosage should be determined by your healthcare provider.";
  
  return dosage
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500) + (dosage.length > 500 ? '...' : '');
}

function extractSideEffects(result: any): string[] {
  const adverseReactions = result.adverse_reactions?.[0] || '';
  
  if (!adverseReactions) return ["Side effect information not available"];
  
  // Extract common side effects
  const effects = adverseReactions
    .match(/(?:common|most common|frequent)[^.]*?(?:include|are|:)([^.]+)/i);
  
  if (effects && effects[1]) {
    return effects[1]
      .split(/,|;|\band\b/)
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.length < 50)
      .slice(0, 6);
  }
  
  // Fallback to generic extraction
  return ["Nausea", "Headache", "Dizziness", "Consult product labeling for complete list"];
}

function extractInteractions(result: any): string[] {
  const interactions = result.drug_interactions?.[0] || '';
  
  if (!interactions) return [];
  
  // Extract drug names mentioned in interactions
  const drugNames = interactions
    .match(/\b[A-Z][a-z]+(?:zole|mycin|cillin|prazole|olol|pril|sartan|statin)\b/g) as string[] | null;
  
  if (drugNames && drugNames.length > 0) {
    return [...new Set(drugNames)].slice(0, 5);
  }
  
  return [];
}

function extractWarnings(result: any): string[] {
  const warnings = result.warnings?.[0] || result.boxed_warning?.[0] || '';
  
  if (!warnings) return [];
  
  const warningsList: string[] = [];
  
  if (result.boxed_warning) {
    warningsList.push("⚠️ BLACK BOX WARNING - Serious risks identified");
  }
  
  if (warnings.toLowerCase().includes('pregnan')) {
    warningsList.push("Consult doctor if pregnant or breastfeeding");
  }
  
  if (warnings.toLowerCase().includes('child')) {
    warningsList.push("Special precautions for children");
  }
  
  if (warnings.toLowerCase().includes('alcohol')) {
    warningsList.push("Avoid alcohol while taking this medication");
  }
  
  return warningsList.slice(0, 4);
}
