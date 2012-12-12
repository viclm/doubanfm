var channelList = [{"name":"红心兆赫","channel_id":-3},{"name":"私人兆赫","seq_id":0,"abbr_en":"My","channel_id":0,"name_en":"Personal Radio"},{"name":"电子","seq_id":1,"abbr_en":"Elec","channel_id":14,"name_en":"Electronic"},{"name":"说唱","seq_id":2,"abbr_en":"Rap","channel_id":15,"name_en":"Rap"},{"name":"Easy","seq_id":3,"abbr_en":"Easy","channel_id":77,"name_en":"Easy"},{"name":"91.1","seq_id":4,"abbr_en":"91.1","channel_id":78,"name_en":"91.1"},{"name":"动漫","seq_id":5,"abbr_en":"Ani","channel_id":28,"name_en":"Anime"},{"name":"华语","seq_id":6,"abbr_en":"CH","channel_id":1,"name_en":"Chinese"},{"name":"欧美","seq_id":7,"abbr_en":"EN","channel_id":2,"name_en":"Euro-American"},{"name":"八零","seq_id":8,"abbr_en":"80","channel_id":4,"name_en":"80"},{"name":"粤语","seq_id":9,"abbr_en":"HK","channel_id":6,"name_en":"Cantonese"},{"name":"轻音乐","seq_id":10,"abbr_en":"Easy","channel_id":9,"name_en":"Easy Listening"},{"name":"咖啡","seq_id":11,"abbr_en":"Caf","channel_id":32,"name_en":"Cafe"},{"name":"中国好声音","seq_id":12,"abbr_en":"The Voice Of China","channel_id":94,"name_en":"The Voice Of China"},{"name":"古典","seq_id":13,"abbr_en":"Cla","channel_id":27,"name_en":"Classic"},{"name":"电影原声","seq_id":14,"abbr_en":"Ori","channel_id":10,"name_en":"Original"},{"name":"九零","seq_id":15,"abbr_en":"90","channel_id":5,"name_en":"90"},{"name":"民谣","seq_id":16,"abbr_en":"Folk","channel_id":8,"name_en":"Folk"},{"name":"小清新","seq_id":17,"abbr_en":"Indie Pop","channel_id":76,"name_en":"Indie Pop"},{"name":"爵士","seq_id":18,"abbr_en":"Jazz","channel_id":13,"name_en":"Jazz"},{"name":"R&B","seq_id":19,"abbr_en":"R&B","channel_id":16,"name_en":"R&B"},{"name":"新歌","seq_id":20,"abbr_en":"NewSongs","channel_id":61,"name_en":"New Songs"},{"name":"女声","seq_id":21,"abbr_en":"FEM","channel_id":20,"name_en":"Female"},{"name":"清零心事","seq_id":22,"abbr_en":"TimeZone","channel_id":100,"name_en":"Time Zone"},{"name":"日语","seq_id":23,"abbr_en":"JPA","channel_id":17,"name_en":"Japanese"},{"name":"Edge正能量","seq_id":24,"abbr_en":"Edge","channel_id":97,"name_en":"Edge"},{"name":"雀巢咖啡","seq_id":25,"abbr_en":"NESCAFE","channel_id":95,"name_en":"NESCAFE"},{"name":"法语","seq_id":26,"abbr_en":"FR","channel_id":22,"name_en":"French"},{"name":"韩语","seq_id":27,"abbr_en":"KRA","channel_id":18,"name_en":"Korea"},{"name":"摇滚","seq_id":28,"abbr_en":"Rock","channel_id":7,"name_en":"Rock"},{"name":"七零","seq_id":29,"abbr_en":"70","channel_id":3,"name_en":"70"},{"name":"全新宝来","seq_id":30,"abbr_en":"New Bora","channel_id":98,"name_en":"New Bora"},{"name":"咪咕汇","seq_id":31,"abbr_en":"MIGUHUI","channel_id":99,"name_en":"MIGUHUI"},{"name":"音乐人","seq_id":32,"abbr_en":"Ar","channel_id":26,"name_en":"Artist"}];

var channelListNew = {};
channelList.forEach(function (channel) {
    channelListNew[channel.channel_id] = channel.name;
});
channelList = channelListNew;
