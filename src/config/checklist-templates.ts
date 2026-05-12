// Checklist Templates

import { ServiceCategory } from "@/types/work-order";

export interface ChecklistTemplate {
  serviceCategory: ServiceCategory;
  label: string;
  items: string[];
}

export const checklistTemplates: ChecklistTemplate[] = [
  {
    serviceCategory: ServiceCategory.WEEKLY_POOL_MAINTENANCE,
    label: "Weekly Pool Maintenance",
    items: [
      "Test water chemistry (pH, chlorine, alkalinity, stabilizer)",
      "Add chemicals as needed",
      "Skim surface debris",
      "Brush walls and floor",
      "Empty skimmer baskets",
      "Empty pump basket",
      "Backwash or clean filter if needed",
      "Check all equipment operation",
      "Check water level",
      "Log chemical readings",
      "Note any equipment issues",
      "Take before/after photos",
    ],
  },
  {
    serviceCategory: ServiceCategory.POOL_REPAIR,
    label: "Pool Repair Diagnostic",
    items: [
      "Document reported issue",
      "Inspect reported problem area",
      "Test related equipment",
      "Diagnose root cause",
      "Document findings with photos",
      "Estimate parts and labor needed",
      "Flag estimate handoff if over threshold",
      "Discuss options with customer (if present)",
    ],
  },
  {
    serviceCategory: ServiceCategory.FILTER_CLEANING,
    label: "Filter Cleaning",
    items: [
      "Turn off pump",
      "Release filter pressure",
      "Open and remove filter cartridge or grids",
      "Inspect for tears or damage",
      "Clean thoroughly with hose",
      "Soak in filter cleaner if needed",
      "Inspect and clean filter housing",
      "Reassemble and check O-rings",
      "Restart and check pressure",
      "Log before/after pressure readings",
      "Take before/after photos",
    ],
  },
  {
    serviceCategory: ServiceCategory.HEATER_SERVICE,
    label: "Heater/Filter Service",
    items: [
      "Inspect heater external condition",
      "Check gas supply and connections",
      "Clean burner and heat exchanger",
      "Test ignition sequence",
      "Check temperature sensors",
      "Verify thermostat operation",
      "Check venting for blockage",
      "Test heater operation to setpoint",
      "Log model, serial, and findings",
      "Take photos of unit and any issues",
    ],
  },
  {
    serviceCategory: ServiceCategory.POOL_REMODEL,
    label: "Remodel Assessment",
    items: [
      "Photograph current pool condition",
      "Document surface condition (plaster, tile, coping)",
      "Check deck condition",
      "Inspect existing equipment",
      "Note customer requests and goals",
      "Measure pool dimensions if needed",
      "Document any structural concerns",
      "Note access and logistics considerations",
      "Flag estimate handoff",
    ],
  },
  {
    serviceCategory: ServiceCategory.EMERGENCY_SERVICE,
    label: "Emergency Leak/Equipment Issue",
    items: [
      "Assess safety — confirm no electrical hazard",
      "Identify source of problem",
      "Document with photos immediately",
      "Stop water loss if possible",
      "Check all equipment status",
      "Determine if temporary fix is possible",
      "Document what was done",
      "Flag estimate handoff for full repair",
      "Notify office of situation",
    ],
  },
];
