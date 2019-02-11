
{% for shader in site.data.shaders %}
<ul>
    <li><a href="editor.html?{{shader.path}}">{{ shader.name }}</a></li>
</ul>
{% endfor %}