import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Country, State, City } from 'country-state-city';
import { ICountry, IState, ICity } from 'country-state-city';

interface AddressSelectorProps {
    country: string;
    setCountry: (value: string) => void;
    state: string;
    setState: (value: string) => void;
    district: string;
    setDistrict: (value: string) => void;
    city: string;
    setCity: (value: string) => void;
    pincode: string;
    setPincode: (value: string) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
    country, 
    setCountry, 
    state, 
    setState, 
    district, 
    setDistrict, 
    city, 
    setCity, 
    pincode, 
    setPincode 
}) => {
    const [countries, setCountries] = useState<ICountry[]>([]);
    const [states, setStates] = useState<IState[]>([]);
    const [districts, setDistricts] = useState<ICity[]>([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
    const [selectedStateCode, setSelectedStateCode] = useState<string>('');

    // Initialize countries on component mount
    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    // When country changes, update states
    useEffect(() => {
        if (country) {
            const selectedCountry = countries.find(c => c.name === country);
            if (selectedCountry) {
                setSelectedCountryCode(selectedCountry.isoCode);
                const statesList = State.getStatesOfCountry(selectedCountry.isoCode);
                setStates(statesList);
                
                // If current state is not in the new states list, clear it
                if (state && !statesList.some(s => s.name === state)) {
                    setState('');
                    setDistrict('');
                }
            }
        }
    }, [country, countries, setState, setDistrict]);

    // When state changes, update districts
    useEffect(() => {
        if (state && selectedCountryCode) {
            const selectedState = states.find(s => s.name === state);
            if (selectedState) {
                setSelectedStateCode(selectedState.isoCode);
                const districtsList = City.getCitiesOfState(selectedCountryCode, selectedState.isoCode);
                setDistricts(districtsList);
                
                // If current district is not in the new districts list, clear it
                if (district && !districtsList.some(d => d.name === district)) {
                    setDistrict('');
                }
            }
        } else {
            // Clear districts if no state is selected
            setDistricts([]);
            setDistrict('');
        }
    }, [state, states, selectedCountryCode, district, setDistrict]);

    // Handle country selection
    const handleCountryChange = (value: string) => {
        setCountry(value);
        setState('');
        setDistrict('');
    };

    // Handle state selection
    const handleStateChange = (value: string) => {
        setState(value);
        setDistrict('');
    };

    return (
        <>
            <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                    Country
                </label>
                <Select 
                    value={country || undefined}
                    onValueChange={handleCountryChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                        {countries.map((country) => (
                            <SelectItem key={country.isoCode} value={country.name}>
                                {country.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                    State
                </label>
                <Select 
                    value={state || undefined} 
                    onValueChange={handleStateChange}
                    disabled={!country}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                        {states.map((state) => (
                            <SelectItem key={state.isoCode} value={state.name}>
                                {state.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                    District
                </label>
                <Select 
                    value={district || undefined} 
                    onValueChange={setDistrict}
                    disabled={!state}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                        {districts.map((district) => (
                            <SelectItem key={district.name} value={district.name}>
                                {district.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                    City/Village
                </label>
                <Input
                    type="text"
                    placeholder="Enter city or village"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />
            </div>
            <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                    Pincode
                </label>
                <Input
                    type="text"
                    placeholder="Enter pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                />
            </div>
        </>
    );
};

export default AddressSelector;
