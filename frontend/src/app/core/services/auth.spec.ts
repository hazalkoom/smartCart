import { AuthService } from './auth';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates service and reports unauthenticated without token', () => {
    const routerMock = { navigate: jasmine.createSpy('navigate') };
    const socketMock = { joinUserRoom: jasmine.createSpy('joinUserRoom'), joinAdminRoom: jasmine.createSpy('joinAdminRoom'), disconnect: jasmine.createSpy('disconnect') };

    const service = new AuthService(
      { get: () => ({ pipe: () => ({ subscribe: () => ({}) }) }), post: () => ({ pipe: () => ({}) }), put: () => ({ pipe: () => ({}) }), delete: () => ({ pipe: () => ({}) }) } as any,
      routerMock as any,
      socketMock as any,
      'browser' as any
    );

    expect(service.isAuthenticated()).toBeFalse();
  });

  it('logout disconnects socket and navigates to login', () => {
    const routerMock = { navigate: jasmine.createSpy('navigate') };
    const socketMock = { joinUserRoom: jasmine.createSpy('joinUserRoom'), joinAdminRoom: jasmine.createSpy('joinAdminRoom'), disconnect: jasmine.createSpy('disconnect') };

    const service = new AuthService(
      {} as any,
      routerMock as any,
      socketMock as any,
      'browser' as any
    );

    service.logout();

    expect(socketMock.disconnect).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
