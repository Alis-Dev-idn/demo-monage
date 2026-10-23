export interface MapConfig {
  defaultCenter?: [number, number];
  defaultZoom?: number;
  styleUrl?: string;
}

export class MapKit {
  private static config: MapConfig = {
    defaultCenter: [106.8272, -6.1751], // Jakarta
    defaultZoom: 12,
    styleUrl: "https://demotiles.maplibre.org/style.json",
  };

  static setup(config: MapConfig): void {
    this.config = { ...this.config, ...config };
  }

  static getConfig(): MapConfig {
    return this.config;
  }
}
