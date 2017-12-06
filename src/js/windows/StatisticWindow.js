class StatisticWindow {

    createWindow() {
        this.botStatisticWindow = WindowFactory.createWindow({width: 300, text: "Statistic"});
        this.connected = false;
        let startTime = new Date();

        let options = [
            {
                name: 'startTime',
                labelText: 'Start at: ',
                spanText: startTime.toLocaleString(navigator.languages[0]),
                appendTo: this.botStatisticWindow
            },
            {
                name: 'credits',
                labelText: 'Credits: ',
                spanText: '0',
                appendTo: this.botStatisticWindow
            },
            {
                name: 'uridium',
                labelText: 'Uridium: ',
                spanText: '0',
                appendTo: this.botStatisticWindow
            },
            {
                name: 'energy',
                labelText: 'GG Energy: ',
                spanText: '0',
                appendTo: this.botStatisticWindow
            },
            {
                name: 'ammo',
                labelText: 'Ammo: ',
                spanText: '0',
                appendTo: this.botStatisticWindow
            },
            {
                name: 'experience',
                labelText: 'Experience: ',
                spanText: '0',
                appendTo: this.botStatisticWindow
            },
            {
                name: 'honor',
                labelText: 'Honor: ',
                spanText: '0',
                appendTo: this.botStatisticWindow
            },
            {
                name: 'speed',
                labelText: 'Speed: ',
                spanText: '0.00 uri/min.',
                appendTo: this.botStatisticWindow
            },
        ];

        if (window.globalSettings.showRuntime) {
            options.push({
                name: 'runtime',
                labelText: 'Runtime: ',
                spanText: '00:00:00',
                appendTo: this.botStatisticWindow
            });
        }

        options.forEach((option)=> {
            this[option.name] = ControlFactory.info(option);
        });

        let standardListeners = [
            {event: 'addCredits', el: 'credits', detailEl: 'credits'},
            {event: 'addUridium', el: 'uridium', detailEl: 'uridium'},
            {event: 'addGgEnergy', el: 'energy', detailEl: 'energy'},
            {event: 'addAmmo', el: 'ammo', detailEl: 'ammo'},
            {event: 'addExperience', el: 'experience', detailEl: 'experience'},
            {event: 'addHonor', el: 'honor', detailEl: 'honor'},
        ];

        standardListeners.forEach((item)=> {
            this.setStandardEventListener(item);
        });

        $(window).on('connection', (e)=> {
            this.connected = e.detail.connected;
        });

        $(window).on('logicEnd', ()=> {
            if (this.connected) {
                let uri = parseInt($('span:last-child', this.uridium).html());
                if (window.globalSettings.showRuntime) {
                    $('span:last-child', this.runtime).text(TimeHelper.diff(startTime));
                }

                $('span:last-child', this.speed).text(this.speedFormat(uri, startTime));
            }
        });
    }

    speedFormat(uri, startTime){

        let timeMinutes = TimeHelper.totalMinutes(startTime);
        let curFormat = window.globalSettings.speedFormat;

        let formats = {
            min: ( uri / timeMinutes ).toFixed(2),
            hour: ( ( uri / timeMinutes)*60 ).toFixed(2),
        };

        let result = uri>0 & timeMinutes>0 ? formats[curFormat]:'0.00';
        result += `  uri/${curFormat}`;

        return result;
    }

    setStandardEventListener({event, el, detailEl}) {
        let htmlEl = this[el];
        $(window).on(event, (e)=> {
            let el = $('span:last-child', htmlEl);
            let collected = parseInt(el.html());
            el.text(parseInt(e.detail[detailEl]) + collected);
        });
    }
}