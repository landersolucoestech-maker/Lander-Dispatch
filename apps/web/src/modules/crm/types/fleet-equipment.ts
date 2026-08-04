export interface FleetEquipment {
  id: string;
  truckYear: string;
  truckMake: string;
  truckModel: string;
  truckVin: string;
  truckColor: string;
  truckPlate: string;
  trailerYear: string;
  trailerMake: string;
  trailerModel: string;
  trailerVin: string;
  trailerColor: string;
  trailerPlate: string;
  assignedDriverId?: string;
  assignedDriverName: string;
  assignedDriverPhoneNumber: string;
  assignedDriverPhoneNumber2: string;
  assignedDriverEmergencyContactName: string;
  assignedDriverEmergencyPhoneNumber: string;
  assignedDriverEmergencyPhoneNumber2: string;
  assignedDriverEmail: string;
}
