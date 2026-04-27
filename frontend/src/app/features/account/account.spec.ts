import { of, throwError } from 'rxjs';
import { Account } from './account';

describe('Account', () => {
  const createComponent = (authOverrides: any = {}) => {
    const authService = {
      currentUser$: of(null),
      addAddress: jasmine.createSpy('addAddress').and.returnValue(of({ success: true, data: [] })),
      deleteAddress: jasmine.createSpy('deleteAddress').and.returnValue(of({ success: true, data: [] })),
      ...authOverrides,
    };

    const component = new Account(
      authService as any,
      { getMyOrders: () => of({ success: true, data: [] }) } as any,
      { fragment: of(null) } as any,
      { navigate: jasmine.createSpy('navigate') } as any,
      { detectChanges: jasmine.createSpy('detectChanges') } as any,
      'browser' as any
    );

    return { component, authService };
  };

  it('uses the shared expanded countries list', () => {
    const { component } = createComponent();

    expect(component.countries.some((country) => country.name === 'Egypt')).toBeTrue();
    expect(component.countries.some((country) => country.name === 'Jordan')).toBeTrue();
  });

  it('saveAddress blocks invalid submissions before API call', () => {
    const { component, authService } = createComponent();

    component.newAddress = {
      alias: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false,
    };

    component.saveAddress();

    expect(component.addressErrorMessage).toContain('Please fill out all required fields');
    expect(authService.addAddress).not.toHaveBeenCalled();
  });

  it('saveAddress normalizes country codes before sending payload', () => {
    const { component, authService } = createComponent();

    component.newAddress = {
      alias: 'Home',
      street: '123 Main',
      city: 'Cairo',
      state: 'Cairo',
      postalCode: '11511',
      country: 'EG',
      isDefault: false,
    };

    component.saveAddress();

    expect(authService.addAddress).toHaveBeenCalled();
    const payload = authService.addAddress.calls.mostRecent().args[0];
    expect(payload.country).toBe('Egypt');
  });

  it('saveAddress surfaces backend errors', () => {
    const { component } = createComponent({
      addAddress: jasmine.createSpy('addAddress').and.returnValue(
        throwError(() => ({ error: { message: 'Country is invalid or unsupported' } }))
      ),
    });

    component.newAddress = {
      alias: 'Home',
      street: '123 Main',
      city: 'Cairo',
      state: 'Cairo',
      postalCode: '11511',
      country: 'Egypt',
      isDefault: false,
    };

    component.saveAddress();

    expect(component.addressErrorMessage).toContain('Country is invalid or unsupported');
  });

  it('getCountryDisplayName resolves known codes and preserves valid names', () => {
    const { component } = createComponent();

    expect(component.getCountryDisplayName('SA')).toBe('Saudi Arabia');
    expect(component.getCountryDisplayName('Egypt')).toBe('Egypt');
  });
});
