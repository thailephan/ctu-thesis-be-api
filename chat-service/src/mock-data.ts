module.exports = {
    rooms: [[], ["1", "2"], ["1"], ["2"]],
    room_typing: new Map<string | number, any>(),
    mock_users: [{
        "id": 1,
        "full_name": "Romeo Mouat",
        "email": "rmouat0@ameblo.jp",
        "gender": "Male",
        "phone_number": "8473196549",
        "address": "56 Sachs Pass"
    }, {
        "id": 2,
        "full_name": "Brett Asprey",
        "email": "basprey1@i2i.jp",
        "gender": "Female",
        "phone_number": "2899824249",
        "address": "38 Forest Dale Plaza"
    }, {
        "id": 3,
        "full_name": "Cate Dowbekin",
        "email": "cdowbekin2@technorati.com",
        "gender": "Female",
        "phone_number": "7856975727",
        "address": "483 Scott Plaza"
    }, {
        "id": 4,
        "full_name": "Karena Tucker",
        "email": "ktucker3@vimeo.com",
        "gender": "Genderfluid",
        "phone_number": "8182411869",
        "address": "07395 Killdeer Trail"
    }, {
        "id": 5,
        "full_name": "Jacquette Fleg",
        "email": "jfleg4@microsoft.com",
        "gender": "Female",
        "phone_number": "4176249131",
        "address": "53029 Namekagon Road"
    }, {
        "id": 6,
        "full_name": "Keane Catonne",
        "email": "kcatonne5@adobe.com",
        "gender": "Male",
        "phone_number": "9443405382",
        "address": "8 Delladonna Trail"
    }, {
        "id": 7,
        "full_name": "Tabbie Kinnaird",
        "email": "tkinnaird6@shareasale.com",
        "gender": "Female",
        "phone_number": "8306862218",
        "address": "0209 Dawn Lane"
    }, {
        "id": 8,
        "full_name": "Johannes McCrae",
        "email": "jmccrae7@t-online.de",
        "gender": "Male",
        "phone_number": "7102981098",
        "address": "87 Corben Road"
    }, {
        "id": 9,
        "full_name": "Don Lidgerton",
        "email": "dlidgerton8@typepad.com",
        "gender": "Male",
        "phone_number": "1128496348",
        "address": "19621 Morning Terrace"
    }, {
        "id": 10,
        "full_name": "Budd Lehrian",
        "email": "blehrian9@yandex.ru",
        "gender": "Male",
        "phone_number": "4444764722",
        "address": "975 Sutteridge Way"
    }],
    users_sockets: new Map<number, string>(),
    friend_requests: [],
    friendships: [],
};
