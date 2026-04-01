import { AbilityBuilder, createMongoAbility, MongoAbility } from "@casl/ability";
import { ERoles } from "@/types/global";

type Actions = "manage" | "read" | "create" | "update" | "delete";
type Subjects =
  | "all"
  | "CoolingUnit"
  | "Location"
  | "User"
  | "Farmer"
  | "Company"
  | "Movement"
  | "Analytics"
  | "Marketplace"
  | "Cart"
  | "Order"
  | "Sale"
  | "BankAccount"
  | "Coupon"
  | "Management"
  | "Produce"
  | "CheckIn"
  | "CheckOut"
  | "Notification"
  | "MarketPrice";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilityFor(role: ERoles | undefined): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case ERoles.SERVICE_PROVIDER:
      can("manage", "all");
      break;

    case ERoles.OPERATOR:
      can("read", "CoolingUnit");
      can("read", "Location");
      can("read", "Farmer");
      can("read", "Produce");
      can("create", "CheckIn");
      can("create", "CheckOut");
      can("update", "CheckIn");
      can("read", "Movement");
      can("read", "Analytics");
      can("read", "Notification");
      can("read", "MarketPrice");
      can("read", "Marketplace");
      can("read", "Cart");
      can("manage", "Sale");
      can("manage", "Order");
      cannot("manage", "Management");
      cannot("manage", "Company");
      break;

    case ERoles.COOLING_USER:
    case ERoles.FARMER:
      can("read", "Produce");
      can("read", "CoolingUnit");
      can("read", "Movement");
      can("read", "Marketplace");
      can("manage", "Cart");
      can("manage", "Order");
      can("read", "Notification");
      can("read", "MarketPrice");
      can("manage", "BankAccount");
      cannot("manage", "Management");
      cannot("manage", "Company");
      cannot("create", "CheckIn");
      cannot("create", "CheckOut");
      break;

    default:
      // AUTH / unauthenticated - no abilities
      break;
  }

  return build();
}
