import store from '../store/index';
import { common } from '../util/common';
const _serverAddress = common.getLocstorage('serverAddress')
export const environment = {
    apiBase:  _serverAddress
}
