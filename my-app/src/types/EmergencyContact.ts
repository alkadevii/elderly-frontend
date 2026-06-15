export type EmergencyContact = {
  _id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
};

export type EmergencyContactFormData = {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
};
