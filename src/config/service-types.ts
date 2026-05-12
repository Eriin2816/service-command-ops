import { ServiceCategory, Priority } from "@/types/work-order";

export interface ServiceTypeConfig {
  value: ServiceCategory;
  label: string;
  description: string;
  estimatedDurationMinutes: number;
}

export interface PriorityOption {
  value: Priority;
  label: string;
  urgencyHint: string;
}

export const serviceTypes: ServiceTypeConfig[] = [
  { value: ServiceCategory.WEEKLY_POOL_MAINTENANCE,    label: "Weekly Pool Maintenance",      description: "Regular weekly pool cleaning and chemical balancing",          estimatedDurationMinutes: 60  },
  { value: ServiceCategory.POOL_REPAIR,                label: "Pool Repair",                  description: "Equipment repair, leak fix, or structural repair",              estimatedDurationMinutes: 120 },
  { value: ServiceCategory.POOL_INSPECTION_DIAGNOSTIC, label: "Pool Inspection / Diagnostic", description: "Full pool inspection and problem diagnosis",                    estimatedDurationMinutes: 90  },
  { value: ServiceCategory.FILTER_CLEANING,            label: "Filter Cleaning",              description: "Filter cartridge or DE grid cleaning",                         estimatedDurationMinutes: 60  },
  { value: ServiceCategory.HEATER_SERVICE,             label: "Heater Service",               description: "Heater inspection, cleaning, or repair",                       estimatedDurationMinutes: 90  },
  { value: ServiceCategory.EQUIPMENT_INSTALLATION,     label: "Equipment Installation",       description: "New pump, filter, heater, or automation installation",          estimatedDurationMinutes: 180 },
  { value: ServiceCategory.POOL_REMODEL,               label: "Pool Remodel",                 description: "Plastering, tiling, decking, or full remodel assessment",      estimatedDurationMinutes: 240 },
  { value: ServiceCategory.NEW_CONSTRUCTION,           label: "New Construction",             description: "New pool build site visit or assessment",                      estimatedDurationMinutes: 120 },
  { value: ServiceCategory.EMERGENCY_SERVICE,          label: "Emergency Service",            description: "Urgent leak, equipment failure, or water safety issue",        estimatedDurationMinutes: 90  },
  { value: ServiceCategory.OTHER,                      label: "Other",                        description: "Service not covered by standard categories",                   estimatedDurationMinutes: 60  },
];

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: Priority.LOW,    label: "Low",    urgencyHint: "No urgency" },
  { value: Priority.NORMAL, label: "Normal", urgencyHint: "Standard"  },
  { value: Priority.HIGH,   label: "High",   urgencyHint: "Prioritize" },
  { value: Priority.URGENT, label: "Urgent", urgencyHint: "Same-day"  },
];

;
