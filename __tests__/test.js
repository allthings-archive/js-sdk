//jest.dontMock('../index.js');

describe('fetchCurrentUser', function() {
  it('calls into $.ajax with the correct params', function() {
    var api = require('../index')({
        path: 'http://api.example.com/'
    });

    api({
        path: 'jo'
    });

    // Now make sure that $.ajax was properly called during the previous
    // 2 lines
    expect(api).toBeCalledWith({
      type: 'GET',
      url: 'http://example.com/currentUser'
    });
  });
});
