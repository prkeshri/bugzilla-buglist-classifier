# bugzilla-buglist-classifier
Open bugzilla bug list(/bugzilla/buglist.cgi). Copy paste this script into your browser's console and call the createUI function. See magic after 100% done!
<ul>
<li>Not contributing directly into bugzilla code. But this script will help to categorise bugs into Critical/Critical, High/Critical etc. Where the former one is priority and latter is severity.</li>
<li>Will hit the server with all the bug numbers, and get the priority and severity values. Finally, will update the UI.</li>
<li>Will convert every link's target to blank</li>
<li><b>New:</b> Filters can be applied. Such as: createUI({filter: filters.since(time)}); time can be '2 s','3 seconds', '3 months', '4.5 days', '5 years', etc.</li>
</ul>
