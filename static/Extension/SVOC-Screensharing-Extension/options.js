document.addEventListener('DOMContentLoaded', populateDomainList);

function populateDomainList() {
  chrome.storage.local.get('pexAllowedDomains', function(value) {
    value = value.pexAllowedDomains;
    domains = value ? JSON.parse(value) : [];
    console.log("Domains: " + domains);
    ul = document.getElementById('domainlist');
    for (var i = 0; i < domains.length; i++) {
      console.log("Adding domain: " + domains[i]);
      var li = document.createElement("li");
      li.id = domains[i];
      li.innerHTML = '<a href="#">' + domains[i] + '</a>';
      var a = document.createElement("a");
      a.classList.add("delete");
      a.addEventListener('click', removeDomain);
      a.innerHTML = "delete";
      li.appendChild(a);
      ul.appendChild(li);
    }
  });
}

function removeDomain(evt) {
  element = evt.srcElement.parentNode;
  domain = element.id;
  console.log("Removing: " + domain);
  chrome.storage.local.get('pexAllowedDomains', function(value) {
    value = value.pexAllowedDomains;
    domains = value ? JSON.parse(value) : [];
    ind = domains.indexOf(domain);
    if (ind > -1) {
      domains.splice(ind, 1);
      chrome.storage.local.set({'pexAllowedDomains': JSON.stringify(domains)});
    }
    ul.removeChild(element);
  });
}
