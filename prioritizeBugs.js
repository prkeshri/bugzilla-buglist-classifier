	function addScript(src,onload) {
		addScript.added = addScript.added || {};
		if(!addScript.added[src]) {
			var sc = document.createElement('script');
			sc.src=src;
			sc.onload = onload;
			document.head.appendChild(sc);
			addScript.added[src] = true;
		} else {
			onload && onload();
		}
	}
	function addCss(href,onload) {
		var link = document.createElement('link');
		link.href=href;
		link.type='text/css';
		link.rel='stylesheet';
		link.onload=onload;
		document.head.appendChild(link);
	}
	function addJQuery(jurl,onload) {
		jurl = jurl || "https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js";
		addScript(jurl,onload);
	}
	function b1(x){
	 return function() 
	 { 
	 	var a=[].splice.call(arguments,0,1); 
	 	return x.apply(a,arguments);
	 }
	}

	function download(filename,text){
	    // Set up the link
	    var link = document.createElement("a");
	    link.setAttribute("target","_blank");
	    if(Blob !== undefined) {
	        var blob = new Blob([text], {type: "text/plain"});
	        link.setAttribute("href", URL.createObjectURL(blob));
	    } else {
	        link.setAttribute("href","data:text/plain," + encodeURIComponent(text));
	    }
	    link.setAttribute("download",filename);
	    document.body.appendChild(link);
	    link.click();
	    document.body.removeChild(link);
	}
	function prioritizeBugs() {
		var self = this;
		var list=arguments;
		bugBugtypeMap = {};
		addJQuery(null,function(){
			var completed = 0;
			var bugMap = {};
			var ps=["Critical", "High", "Medium", "Low"];
			var ss = ["blocker", "critical", "High", "Medium", "Low", "Enhancement"];
			$(list).each(function(i,bug){
				$.get('/bugzilla/show_bug.cgi?id='+bug,function(txt){
					
					//download(bug+'.bug.html',txt);
					txt = $(txt);
					var p = '#priority'
					p = txt.find(p);
					var s = '#bug_severity'
					s=txt.find(s);

					if(!ps) {
						ps = p.split('\n').map(b1(String.prototype.trim));
						ps = ps.splice(1,ps.length-1);
					}
					if(!ss) {
						ss = s.split('\n').map(b1(String.prototype.trim));
						ss = ss.splice(1,ss.length-1);
					}

					bugBugtypeMap = bugBugtypeMap || {};
					bugBugtypeMap[bug] = p.val() + '/' + s.val();

					var pi = ps.indexOf(p.val()),
						si = ss.indexOf(s.val());

					var pi_si = pi * ss.length + si;

					bugMap[pi_si]=bugMap[pi_si] || [];
					bugMap[pi_si].push({id:bug,html:txt});

					completed++;
					if(completed==list.length) {
						console.log('Prioritization completed!');
						bugMapF = {}
						Object.keys(bugMap).sort(function(k1,k2){return k1-k2;}).forEach(function(k){ bugMapF[k]=bugMap[k];});
						console.log(bugMapF);
						if(typeof self =='function') {
							self(bugMapF);
						}
					} else {
						console.log(parseInt((completed/list.length)*100) + '% done!');
					}
				})
			});
		});	
	}

	function getBugList() {
		var trs='#bugzilla-body > table.bz_buglist > tbody> tr'
		trs = document.querySelectorAll(trs);
		tbugs = {};
		var list = [];
		trs.forEach(function(tr,i){
			if(i==0) return; // Header
			var tds = $$('td',tr);
			var td_id = tds[0].textContent.trim();
			var td_status_sel = tds[4];
			var td_status = td_status_sel.textContent.trim();
			if(td_status=='CONF' || td_status=='Reop') {
				list.push(td_id);
				tbugs[td_id] = tds[6].textContent.trim();
			}
		});
		return list;
	}

	function revampBugs(bugsInPriority) {
		var self = this || {};
		addJQuery(null, function(){

			var trs='#bugzilla-body > table.bz_buglist > tbody> tr'
			$('a').attr('target','_blank');
			trs = $(trs);
			var tr0 = trs[0];
			var trsMap = {};
			var trsTdsMap = {};
			trs.each(function(i){
				var tr= this;
				if(i==0) return;
				var tds = $('td',tr);
				var td_id = tds[0].textContent.trim();
				trsMap[td_id] = tr;
				trsTdsMap[td_id] = tds;
			});

			var bugsSortedPriority = Object.keys(bugsInPriority).sort(function(x,y){ return x-y;});

			var totalBugs = 0;
			var trHead = $('tr.bz_buglist_header.bz_first_buglist_header');
			if(trHead.text().indexOf('#') == -1) {
				trHead.prepend('<th>#</th>');
			}

			var html = tr0.outerHTML+ bugsSortedPriority.map(
				function(bugSortedPriority){
					var bugs = bugsInPriority[bugSortedPriority];
					var head = '<tr><td colspan="5"><b>'+ bugBugtypeMap[bugs[0].id] +'</b></td></tr>';
					var bugTypeBugs = 0;
					var html = bugs.map(function (bugObj){
						var bug = bugObj.id;
						if(trsMap[bug] && trsMap[bug].outerHTML) 
						{
							if(trsMap[bug]) {
								if(self.filter && !self.filter(bugObj, trsMap[bug],trsTdsMap[bug])) {
									return '';
								}
								var tdSl = "<td>" + (++totalBugs) + "/"+ (++bugTypeBugs) +"</td>";
								var tr = $(trsMap[bug]);
								tr.prepend(tdSl);
								return tr.html();
							}
						}	
						return '';
					}).join('');
					if(!html) return html;
					return head+html;
				} ).join('');
			$('#bugzilla-body > table.bz_buglist > tbody').html(html);
			var bugsOpen = totalBugs + ' bugs open';
			if(self.filter && self.filter.appendText) {
				bugsOpen +=self.filter.appendText;
			}
			bugsOpen+='!';
			$('.bz_result_count').text(bugsOpen);
			console.log('Done!');
		});
	}

	function createUI(options) {
		var list = getBugList();
		prioritizeBugs.apply(revampBugs.bind(options), list);
		return 'Processing ...';
	}

var filters = {
	since: function(since) {
		var self = this;
		since = since.toString();
		var floatPart = parseFloat(since);
		var currency = since.substr(floatPart.toString().length) || 'days';
		currency = currency.trim();
		var totalSince = floatPart; // assumed!
		var cm = ['s',1,'m',60,'h',60,'d',24,'y',30*12];
		var i=-1;
		while(++i<cm.length) {
			totalSince*= cm[i+1];
			if(currency[0]==cm[i]) {
				break;
			}
			i++;
		}
		//return totalSince;
		totalSince*=1000; //ms
		var now = new Date;
		var filter = function(bug, tr, tds) {
			var modifiedAt = bug.html.find('#bz_show_bug_column_2 > table > tbody > tr:nth-child(2) > td');
			modifiedAt = modifiedAt.text().split('(')[0].trim();
			var d = new Date(modifiedAt);
			var diff = now - d ;
			return (diff <= totalSince);
		};
		var diff = new Date(now - totalSince);
		filter.appendText = ' since ' + diff;
		return {filter: filter};
	},
	skipWhenReportedBy: function(emailHrefs) {
		/*var emailHrefs = Array.prototype.slice.call(arguments);
		*/emailHrefs = emailHrefs.map(function(email) {
			return 'mailto:'+email;
		})
		const emailField = '#bz_show_bug_column_2 > table > tbody > tr:nth-child(1) > td > span > a';
		return function(bug, tr, tds) {
			var emailHref = bug.html.find(emailField).attr('href');
			return emailHrefs.indexOf(emailHref) == -1;
		}
	}
}
