import "rbx/base/helpers/variables";
import { VariablesDefaults } from "rbx/base/helpers/variables";

/**
 * https://dfee.github.io/rbx/architecture/customize
 */
declare module "rbx/base/helpers/variables" {
  interface VariablesOverrides {
    colors: VariablesDefaults["colors"] | "twitter";
  }
}
