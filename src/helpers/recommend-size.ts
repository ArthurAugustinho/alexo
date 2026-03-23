import type {
  SizeChartRange,
  UserMeasurements,
} from "@/lib/size-chart-schema";

const MEASUREMENT_KEYS = [
  {
    measurementKey: "bust",
    minField: "bustMin",
    maxField: "bustMax",
  },
  {
    measurementKey: "waist",
    minField: "waistMin",
    maxField: "waistMax",
  },
  {
    measurementKey: "hip",
    minField: "hipMin",
    maxField: "hipMax",
  },
  {
    measurementKey: "height",
    minField: "heightMin",
    maxField: "heightMax",
  },
  {
    measurementKey: "weight",
    minField: "weightMin",
    maxField: "weightMax",
  },
] as const;

export type SizeRecommendationItem = {
  sizeLabel: string;
  score: number;
  matches: number;
  relevantMeasurements: number;
  position: number;
};

export type SizeRecommendation = {
  recommended: string | null;
  confidence: "exact" | "closest" | "none";
  message: string;
  allSizes: SizeRecommendationItem[];
};

function hasAnyMeasurement(measurements: UserMeasurements) {
  return Object.values(measurements).some(
    (value) => typeof value === "number" && Number.isFinite(value),
  );
}

export function recommendSize(
  measurements: UserMeasurements,
  sizeChart: SizeChartRange[],
): SizeRecommendation {
  if (!hasAnyMeasurement(measurements) || sizeChart.length === 0) {
    return {
      recommended: null,
      confidence: "none",
      message: "Informe ao menos uma medida para receber uma recomendacao",
      allSizes: [...sizeChart]
        .sort((first, second) => first.position - second.position)
        .map((entry) => ({
          sizeLabel: entry.sizeLabel,
          score: 0,
          matches: 0,
          relevantMeasurements: 0,
          position: entry.position,
        })),
    };
  }

  const allSizes = [...sizeChart]
    .sort((first, second) => first.position - second.position)
    .map<SizeRecommendationItem>((entry) => {
      let matches = 0;
      let relevantMeasurements = 0;

      for (const measurementConfig of MEASUREMENT_KEYS) {
        const measurementValue = measurements[measurementConfig.measurementKey];
        const minValue = entry[measurementConfig.minField];
        const maxValue = entry[measurementConfig.maxField];

        if (
          typeof measurementValue !== "number" ||
          typeof minValue !== "number" ||
          typeof maxValue !== "number"
        ) {
          continue;
        }

        relevantMeasurements += 1;

        if (measurementValue >= minValue && measurementValue <= maxValue) {
          matches += 1;
        }
      }

      return {
        sizeLabel: entry.sizeLabel,
        score:
          relevantMeasurements > 0
            ? Math.round((matches / relevantMeasurements) * 100)
            : 0,
        matches,
        relevantMeasurements,
        position: entry.position,
      };
    });

  const recommendedEntry = [...allSizes].sort((first, second) => {
    if (second.score !== first.score) {
      return second.score - first.score;
    }

    if (second.matches !== first.matches) {
      return second.matches - first.matches;
    }

    if (second.relevantMeasurements !== first.relevantMeasurements) {
      return second.relevantMeasurements - first.relevantMeasurements;
    }

    return first.position - second.position;
  })[0];

  if (!recommendedEntry || recommendedEntry.relevantMeasurements === 0) {
    return {
      recommended: null,
      confidence: "none",
      message: "Informe ao menos uma medida para receber uma recomendacao",
      allSizes,
    };
  }

  if (recommendedEntry.score === 100) {
    return {
      recommended: recommendedEntry.sizeLabel,
      confidence: "exact",
      message: `Suas medidas correspondem exatamente ao tamanho ${recommendedEntry.sizeLabel}`,
      allSizes,
    };
  }

  return {
    recommended: recommendedEntry.sizeLabel,
    confidence: "closest",
    message: `O tamanho mais proximo das suas medidas e o ${recommendedEntry.sizeLabel}`,
    allSizes,
  };
}
