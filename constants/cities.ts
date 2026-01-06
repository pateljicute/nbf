export interface City {
    name: string;
    tier: 1 | 2 | 3 | 4;
    state: string;
    popular?: boolean;
}

export const INDIAN_CITIES: City[] = [
    // Tier 1 (Metropolitan)
    { name: 'Mumbai', tier: 1, state: 'Maharashtra', popular: true },
    { name: 'Delhi', tier: 1, state: 'Delhi', popular: true },
    { name: 'Bangalore', tier: 1, state: 'Karnataka', popular: true },
    { name: 'Hyderabad', tier: 1, state: 'Telangana', popular: true },
    { name: 'Chennai', tier: 1, state: 'Tamil Nadu', popular: true },
    { name: 'Kolkata', tier: 1, state: 'West Bengal', popular: true },
    { name: 'Pune', tier: 1, state: 'Maharashtra', popular: true },
    { name: 'Ahmedabad', tier: 1, state: 'Gujarat', popular: true },

    // Tier 2
    { name: 'Indore', tier: 2, state: 'Madhya Pradesh', popular: true },
    { name: 'Jaipur', tier: 2, state: 'Rajasthan', popular: true },
    { name: 'Surat', tier: 2, state: 'Gujarat' },
    { name: 'Lucknow', tier: 2, state: 'Uttar Pradesh' },
    { name: 'Kanpur', tier: 2, state: 'Uttar Pradesh' },
    { name: 'Nagpur', tier: 2, state: 'Maharashtra' },
    { name: 'Patna', tier: 2, state: 'Bihar' },
    { name: 'Bhopal', tier: 2, state: 'Madhya Pradesh' },
    { name: 'Visakhapatnam', tier: 2, state: 'Andhra Pradesh' },
    { name: 'Vadodara', tier: 2, state: 'Gujarat' },
    { name: 'Ludhiana', tier: 2, state: 'Punjab' },
    { name: 'Agra', tier: 2, state: 'Uttar Pradesh' },
    { name: 'Nashik', tier: 2, state: 'Maharashtra' },

    // Tier 3
    { name: 'Udaipur', tier: 3, state: 'Rajasthan', popular: true },
    { name: 'Mandsaur', tier: 3, state: 'Madhya Pradesh', popular: true },
    { name: 'Kota', tier: 3, state: 'Rajasthan' },
    { name: 'Jodhpur', tier: 3, state: 'Rajasthan' },
    { name: 'Gwalior', tier: 3, state: 'Madhya Pradesh' },
    { name: 'Jabalpur', tier: 3, state: 'Madhya Pradesh' },
    { name: 'Raipur', tier: 3, state: 'Chhattisgarh' },
    { name: 'Allahabad', tier: 3, state: 'Uttar Pradesh' },
    { name: 'Aurangabad', tier: 3, state: 'Maharashtra' },
    { name: 'Dehradun', tier: 3, state: 'Uttarakhand' },

    // Tier 4 (Small Towns / Examples)
    { name: 'Ratlam', tier: 4, state: 'Madhya Pradesh' },
    { name: 'Neemuch', tier: 4, state: 'Madhya Pradesh' },
    { name: 'Chittorgarh', tier: 4, state: 'Rajasthan' },
    { name: 'Dewas', tier: 4, state: 'Madhya Pradesh' },
    { name: 'Ujjain', tier: 4, state: 'Madhya Pradesh' },
    { name: 'Satna', tier: 4, state: 'Madhya Pradesh' },
    { name: 'Rewa', tier: 4, state: 'Madhya Pradesh' }
];

export const POPULAR_CITIES = INDIAN_CITIES.filter(c => c.popular);
