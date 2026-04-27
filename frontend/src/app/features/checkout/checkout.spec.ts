import { CheckoutComponent } from './checkout';

describe('CheckoutComponent', () => {
  const createComponent = () => {
    const component = new CheckoutComponent(
      {} as any,
      {} as any,
      { currentUser$: { subscribe: () => ({ unsubscribe: () => {} }) }, getUserProfile: () => ({ subscribe: () => ({}) }) } as any,
      { navigate: jasmine.createSpy('navigate') } as any,
      { detectChanges: jasmine.createSpy('detectChanges') } as any,
      'browser' as any
    );

    return component;
  };

  it('exposes a broad shared countries list including Egypt and Arab countries', () => {
    const component = createComponent();

    expect(component.countries.some((country) => country.name === 'Egypt')).toBeTrue();
    expect(component.countries.some((country) => country.name === 'Saudi Arabia')).toBeTrue();
    expect(component.countries.some((country) => country.name === 'United Arab Emirates')).toBeTrue();
  });

  it('selectAddress(new) resets address fields while keeping email and phone', () => {
    const component = createComponent();
    component.shippingAddress = {
      email: 'user@test.com',
      phone: '01012345678',
      street: 'old',
      city: 'old',
      state: 'old',
      postalCode: 'old',
      country: 'old',
    };

    component.selectAddress('new');

    expect(component.shippingAddress.email).toBe('user@test.com');
    expect(component.shippingAddress.phone).toBe('01012345678');
    expect(component.shippingAddress.street).toBe('');
    expect(component.shippingAddress.city).toBe('');
    expect(component.shippingAddress.country).toBe('');
  });

  it('normalizes saved address country code to display name', () => {
    const component = createComponent();
    component.savedAddresses = [
      {
        _id: 'addr-1',
        alias: 'Home',
        street: '123 Street',
        city: 'Cairo',
        postalCode: '11511',
        country: 'EG',
        isDefault: true,
      },
    ];

    component.selectAddress('addr-1');

    expect(component.shippingAddress.country).toBe('Egypt');
  });

  it('getCountryDisplayName resolves known codes and preserves names', () => {
    const component = createComponent();

    expect(component.getCountryDisplayName('AE')).toBe('United Arab Emirates');
    expect(component.getCountryDisplayName('Egypt')).toBe('Egypt');
  });
});
