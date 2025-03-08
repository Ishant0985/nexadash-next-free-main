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

    const AddressSelector: React.FC<AddressSelectorProps> = ({ country, setCountry, state, setState, district, setDistrict, city, setCity, pincode, setPincode }) => {
        const [countries, setCountries] = useState<ICountry[]>([]);
    const [states, setStates] = useState<IState[]>([]);
    const [districts, setDistricts] = useState<ICity[]>([]);

    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    useEffect(() => {
        if (country) {
            const selectedCountry = countries.find(c => c.name === country);
            if (selectedCountry) {
                setStates(State.getStatesOfCountry(selectedCountry.isoCode));
            }
        }
    }, [country, countries]);

    useEffect(() => {
        if (state) {
            const selectedState = states.find(s => s.name === state);
            if (selectedState) {
                setDistricts(City.getCitiesOfState(selectedState.countryCode, selectedState.isoCode));
            }
        }
    }, [state, states]);

    return (
        <>
            <div className="space-y-2.5">
                <label className="block font-semibold leading-tight text-black">
                    Country
                </label>
                <Select onValueChange={setCountry} value={country}>
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
                <Select onValueChange={setState} value={state}>
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
                <Select onValueChange={setDistrict} value={district}>
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
