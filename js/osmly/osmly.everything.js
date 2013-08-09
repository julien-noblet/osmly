osmly.everything = (function () {
    function locate() {
        // absolutely in no way comprehensive
        var location = {};
        if (window.location.search) {
            var search = window.location.search.split('?');
            for (var a = 0; a < search.length; a++) {
                if (a == search.length-1) {
                    /* remove trailing slash */
                    if (search[a].substr(-1) == '/') {
                        search[a] = search[a].slice(0,-1);
                    }
                }

                if (search[a] != '') {
                    var split = search[a].split('=');
                    if (split.length = 2) {
                        location[split[0]] = split[1];
                    }
                }
            }
        }
        return location;
    }

    function buildTable() {
        // need to check the current state of filters, possibly apply them
        // then buildTable as a callback


        // index from simple.py: id, problem, done, user, time
        items = window.everything;

        if (document.getElementsByTagName('tbody').length) {
            // clear the way
            var table = document.getElementById('main_table');
            table.removeChild(document.getElementsByTagName('tbody')[0]);
        }

        var table = document.createElement('tbody');

        for (var a = 0; a < items.length; a++) {
            // rows
            var tr = document.createElement('tr');
            for (var b = 0; b < items[a].length; b++) {
                // columns
                var column = document.createElement('td');

                if (b == 2) {
                    // checkmark for done items
                    if (items[a][b] === 1) {
                        var text = '&#x2713;';
                    } else {
                        var text = '';
                    }
                } else {
                    var text = items[a][b];
                }

                if (b == 4) {
                    if (items[a][b]) {
                        var date = new Date(items[a][b]*1000),
                            months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                            text = months[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getFullYear() + ' ' + 
                                date.getHours() + ':' + date.getMinutes();
                    }
                }

                column.innerHTML = text;
                tr.appendChild(column);
            }

            // mark as done
            var column = document.createElement('td');
            if (items[a][2] === 0) {
                // put a button in there, alert for confirmation
                // need to pass the id somehow
                // need to pass the id
                column.innerHTML = '<span href="" onclick=done("' + items[a][0] +'")>mark as done?</span>';
            }
            tr.appendChild(column);

            // edit in josm
            var column = document.createElement('td');
            if (items[a][2] === 0) {
                // put a button in there, use modal for notifying it's ready/failed
                // need to pass the id
                column.innerHTML = '<span href="" onclick=edit("' + items[a][0] +'")>edit in JOSM</span>';
            }
            tr.appendChild(column);

            // background-colors
            // careful with the order here, it's not obvious
            // some problems might have been fixed manually yet still have 'problem' in db
            if (items[a][2] === 1) {
                tr.setAttribute('class', 'success');
            } else if (items[a][1] != '') {
                tr.setAttribute('class', 'error');
            }

            table.appendChild(tr);
            document.getElementById('main_table').appendChild(table);
        }

        count_current_rows();
    };

    function request(query, callback) {
        $.ajax({
            url: query,
            cache: false
        }).done(function(items){
            window.everything = JSON.parse(items);
            window.everythingRaw = JSON.parse(items);
            // window.everything is the current state of the table
            // window.everythingRaw is the originally fetched data
            if (callback) callback();
        });
    }

    function refresh(callback) {
        request(window.loc['db'] + '&everything', callback)
    }

    function filter(options){
        // {'problem': 1, 'user': 'Joe Fake Name'}
        // also takes values as a list of multiple possible values
            // {'problem': ['no_park', 'bad_imagery', 'you_ugly']}
            // or even better: {'problem': unique('problem')}
        // index from simple.py: id, problem, done, user, time
        var ndx = {
            'problem': 1,
            'done': 2,
            'user': 3,
            'time': 4
        }

        var items = window.everythingRaw,
            out = [];

        for (var a = 0; a < items.length; a++) {
            var keep = false;
            for (var option in options) {
                if (typeof options[option] == 'object') {
                    if (options[option].indexOf(items[a][ndx[option]]) !== -1) {
                        keep = true
                    }
                } else if (items[a][ndx[option]] == options[option]) {
                    keep = true;
                }
                if (keep) out.push(items[a]);
            }
        }
        window.everything = out;
    }

    function count(options) {
        // {'done': 1, 'user': 'Joe'}
        var ndx = {
            'problem': 1,
            'done': 2,
            'user': 3,
            'time': 4
        }

        var items = window.everything,
            out = {};

        for (var option in options) {
            out[option] = 0;
        }

        for (var a = 0; a < items.length; a++) {
            for (var option in options) {
                if (items[a][ndx[option]] == options[option]) {
                    out[option]++;
                }
            }
        }

        return out;
    }

    function unique(column) {
        // lists unique values for a given column
        // probably only useful for 'problem' and 'user'
        var ndx = {
            'problem': 1,
            'done': 2,
            'user': 3,
            'time': 4
        }
        
        var items = window.everythingRaw,
            unique = [];

        for (var a = 0; a < items.length; a++) {
            if (items[a][ndx[column]] && unique.indexOf(items[a][ndx[column]]) === -1) {
                unique.push(items[a][ndx[column]]);
            }
        }

        return unique;
    }

    function problem_selection() {
        var problems = unique('problem'),
            html = '',
            select = document.getElementById('problems-select');

        for (var a = 0; a < problems.length; a++) {
            html += '<option value="problem:' + problems[a] + '">' + problems[a] + '</option>';
        }

        select.innerHTML = html;
    }

    function user_selection() {
        var user = unique('user'),
            html = '',
            select = document.getElementById('users-select');

        for (var a = 0; a < user.length; a++) {
            html += '<option value="user:' + user[a] +'">' + user[a] + '</option>';
        }

        select.innerHTML = html;
    }

    function click_everything() {
        window.everything = window.everythingRaw;
        buildTable();
    }

    function click_red() {
        filter({
            'problem': unique('problem')
        });
        buildTable();
    }

    function click_green() {
        filter({'done': 1});
        buildTable();
    }

    function drop_selection(select) {
        // this is much too involved for what it does
        // gets the value of the changed dropdown menu and filters based on it
        // also selects the parent radio button
        var selector = document.getElementById(select),
            value = selector.options[selector.selectedIndex].value,
            dict = {};
        value = value.split(':');
        dict[value[0]] = value[1];
            // dict is necessary because value = {value[0]: value[1]} didn't work
                // seems like it should?

        // filter the items, rebuild the table w/ filtered items
        filter(dict);
        buildTable();

        // select the parent radio button
        var parentRadio = select.split('-')[0],
            controls = document.getElementById('controls'),
            radios = controls.getElementsByTagName('input');

        for (var i = 0; i < radios.length; i++) {
            if (radios[i].type === 'radio') {
                if (radios[i].value == parentRadio) {
                    radios[i].checked = true;
                } else {
                    radios[i].checked = false;
                }
            }
        }
    }

    function count_current_rows() {
        var count = document.getElementById('count');

        if (window.everything.length === window.everythingRaw.length) {
            count.innerHTML = window.everything.length;
        } else {
            count.innerHTML = window.everything.length.toString() + '<span>/' + window.everythingRaw.length + '</span>';
        }
    }

    window.loc = locate()
    if (window.loc['db']) {
        window.loc['db'] = decodeURIComponent(loc['db']);
        refresh(function() {
            buildTable();
            problem_selection();
            user_selection();
        });
    } else {
        console.log('need a db to load. /?db=');
    }

    return everything;
}());